const fs = require("fs");
const path = require("path");
const HttpError = require("./HttpError");

const getExt = async (filePath) => {
  const splittedArray = filePath.split(".");
  return splittedArray[splittedArray.length - 1];
};

const getImageBase64 = async (filePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const fileStream = fs.createReadStream(
        path.resolve(__dirname, `../uploads/${filePath}`)
      );

      const ext = await getExt(filePath);

      const chunks = [];

      fileStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      fileStream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64Data = buffer.toString("base64");
        resolve(`data:image/${ext};base64, ${base64Data}`);
      });

      fileStream.on("error", (err) => {
        reject(new HttpError(404, "File not found or malformed file path."));
      });
    } catch (error) {
      reject(new HttpError(404, "File not found or malformed file path."));
    }
  });
};

module.exports = {
  getImageBase64,
};
