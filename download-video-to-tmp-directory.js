const fs = require("fs");
const AWS = require("aws-sdk");
const generateTmpFilePath = require("./generate-tmp-file-path");

module.exports = async (triggerBucketName, videoFileName) => {
	console.log(`downloading...${videoFileName} from ${triggerBucketName}.`)
	const downloadResult = await getVideoFromS3(triggerBucketName, videoFileName);
	const videoAsBuffer = downloadResult.Body;
	const tmpVideoFilePath = await saveFileToTmpDirectory(videoAsBuffer);
	return tmpVideoFilePath;
}

//pass the input bucket name and fileName
const getVideoFromS3 = async (triggerBucketName, fileName) => {
	const s3 = new AWS.S3();
	const res = await s3.getObject({
		Bucket: triggerBucketName,
		Key: fileName
	}).promise();
	return res;
};

//save video to tmp dir
const saveFileToTmpDirectory = async (fileAsBuffer) => {
    const tmpVideoPathTemplate = "/tmp/vid-{HASH}.mp4";
    const tmpVideoFilePath = generateTmpFilePath(tmpVideoPathTemplate);
	await fs.promises.writeFile(tmpVideoFilePath, fileAsBuffer, "base64");
	return tmpVideoFilePath;
};