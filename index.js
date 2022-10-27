const fs = require("fs");
const path = require("path");
const doesFileExist = require("./does-file-exist");
const downloadVideoToTmpDirectory = require("./download-video-to-tmp-directory");
const generateThumbnailsFromVideo = require("./generate-thumbnails-from-video");

const THUMBNAILS_TO_CREATE = process.env.total_thumbnail;

exports.handler = async (event) => {
    // await wipeTmpDirectory();
	const { videoFileName, triggerBucketName } = extractParams(event);
	console.log(`${videoFileName} was uploaded to ${triggerBucketName}!`);
	
	const tmpVideoPath = await downloadVideoToTmpDirectory(triggerBucketName, videoFileName);
	console.log(`Temp Video Path: ${tmpVideoPath}`);

	if (doesFileExist(tmpVideoPath)) {
		console.log(`File is existed.`);
		await generateThumbnailsFromVideo(tmpVideoPath, THUMBNAILS_TO_CREATE, videoFileName);
	}
};

const extractParams = event => {
	const videoFileName = decodeURIComponent(event.Records[0].s3.object.key).replace(/\+/g, " ");
	const triggerBucketName = event.Records[0].s3.bucket.name;

	return { videoFileName, triggerBucketName };
};

const wipeTmpDirectory = async () => {
    const files = await fs.promises.readdir("/tmp/");
    const filePaths = files.map(file => path.join("/tmp/", file));
    await Promise.all(filePaths.map(file => fs.promises.unlink(file)));
}