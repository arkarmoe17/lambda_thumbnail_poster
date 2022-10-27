module.exports = (filePathTemplate) => {
    const hash = getRandomString(10);
	return filePathTemplate.replace("{HASH}", hash);
}

const getRandomString = (len) => {
    const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";

	for (let i = len; i > 0; --i) {
		result += charset[Math.floor(Math.random() * charset.length)];
	}
	return result;
}