const multer = require("multer");
// const storage = require("../utils/storage");
const HttpError = require("../utils/HttpError");
const fs = require("fs");
const path = require("path");

const multerFilter = (req, file, cb) => {
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/bmp",
      "image/gif",
      "image/webp",
    ].includes(file.mimetype)
  ) {
    cb(
      new HttpError(
        400,
        "Invalid file type. Only jpeg, png, bmp and gif files are supported."
      )
    );
  }
  cb(null, true);
};

const multerStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const folderPath = path.resolve(__dirname, `../uploads/${req.user._id}`);
      if (!fs.existsSync(folderPath)) {
        await fs.mkdirSync(folderPath);
      }
      cb(null, folderPath);
    } catch (e) {
      next(e);
    }
  },
  filename: async (req, file, cb) => {
    try {
      const fileName = `${new Date().getTime()}-${file.originalname}`;
      const filePath = `${req.user._id}/${fileName}`;
      req.filePath = filePath;
      cb(null, fileName);
    } catch (e) {
      next(e);
    }
  },
});

const multerConfig = {
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1024 * 1024 * 20 },
};

const upload = multer(multerConfig);

module.exports = upload;
