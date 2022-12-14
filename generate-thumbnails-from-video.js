const AWS = require("aws-sdk");
const fs = require("fs");
const { spawnSync } = require("child_process");
const doesFileExist = require("./does-file-exist");
const generateTmpFilePath = require("./generate-tmp-file-path");

const ffprobePath = "/opt/bin/ffprobe";
const ffmpegPath = "/opt/bin/ffmpeg";

const THUMBNAIL_TARGET_BUCKET = process.env.destionation_bucket; //your destination bucket


module.exports = async (tmpVideoPath, numberOfThumbnails, videoFileName) => {
    console.log(`Generate thumbnail from path: ${tmpVideoPath} , name: ${videoFileName}`)
    
    const randomTimes = generateRandomTimes(tmpVideoPath, numberOfThumbnails);
    console.log(`randomTimes:${randomTimes}`);
    
    for(const [index, randomTime] of Object.entries(randomTimes)) {
        const tmpThumbnailPath = await createImageFromVideo(tmpVideoPath, randomTime);

        if (doesFileExist(tmpThumbnailPath)) {
            const nameOfImageToCreate = generateNameOfImageToUpload(videoFileName, index);
            console.log(`thumbnail img name:${nameOfImageToCreate}`);
            await uploadFileToS3(tmpThumbnailPath, nameOfImageToCreate);
        }
    }
}

const generateRandomTimes = (tmpVideoPath, numberOfTimesToGenerate) => {
    console.log(`number of times:${numberOfTimesToGenerate} | path: ${tmpVideoPath}`);
    const timesInSeconds = [];
    const videoDuration = getVideoDuration(tmpVideoPath);
    
    console.log(`video duration is ${videoDuration}`);
    
    for (let x = 0; x < numberOfTimesToGenerate; x++) {
        const randomNum = getRandomNumberNotInExistingList(timesInSeconds, videoDuration);
        
        if(randomNum >= 0) {
            timesInSeconds.push(randomNum);
        }
    }
    return timesInSeconds;
};

const getVideoDuration = (tmpVideoPath) => {
    const ffprobe = spawnSync(ffprobePath, [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=nw=1:nk=1",
        tmpVideoPath
    ]);
    return Math.floor(ffprobe.stdout.toString());
};

const getRandomNumberNotInExistingList = (existingList, maxValueOfNumber) => {
    for (let attemptNumber = 0; attemptNumber < 3; attemptNumber++) {
        const randomNum = getRandomNumber(maxValueOfNumber);
        
        if (!existingList.includes(randomNum)) {
            return randomNum;
        }
    }

    return -1;
}

const getRandomNumber = (upperLimit) => {
    return Math.floor(Math.random() * upperLimit);
};

const createImageFromVideo = (tmpVideoPath, targetSecond) => {
    const tmpThumbnailPath = generateThumbnailPath(targetSecond);
    const ffmpegParams = createFfmpegParams(tmpVideoPath, tmpThumbnailPath, targetSecond);
    spawnSync(ffmpegPath, ffmpegParams);
    return tmpThumbnailPath;
};

const generateThumbnailPath = (targetSecond) => {
    const tmpThumbnailPathTemplate = "/tmp/thumbnail-{HASH}-{num}.jpg";
    const uniqueThumbnailPath = generateTmpFilePath(tmpThumbnailPathTemplate);
    return uniqueThumbnailPath.replace("{num}", targetSecond);
};

// thumbnail,scale=-1:140
// thumbnail,scale='-1:min(140\, iw)'
const createFfmpegParams = (tmpVideoPath, tmpThumbnailPath, targetSecond) => {
    return [
        "-ss", targetSecond,
        "-i", tmpVideoPath,
        "-vf", "thumbnail,scale=80:140",
        "-vframes", 1,
        tmpThumbnailPath
    ];
};

const generateNameOfImageToUpload = (videoFileName,i) => {
    // const strippedExtension = videoFileName.replace(".mp4", "");
    // return `${strippedExtension}-${i}.jpg`;
    return `${videoFileName}.jpg`;
};

const uploadFileToS3 = async (tmpThumbnailPath, nameOfImageToCreate) => {
    const contents = fs.createReadStream(tmpThumbnailPath);
    const uploadParams = {
        Bucket: THUMBNAIL_TARGET_BUCKET,
        Key: nameOfImageToCreate,
        Body: contents,
        ContentType: "image/jpg"
    };

    const s3 = new AWS.S3();
    await s3.putObject(uploadParams).promise();
};