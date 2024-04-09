const jwt = require("jsonwebtoken");
const config = require("../config");
const userModel = require("../models/users.model");
const HttpError = require("../utils/HttpError");

const authorizeUser = async (req, res, next) => {
  try {
    const header = req.headers["authorization"] || null;
    const token = header?.split(" ")[1];
    if (!header || !token) {
      throw new HttpError(401, "Access token not provided.");
    }
    jwt.verify(token, config.jwtSecret, async (err, data) => {
      try {
        if (err) {
          if (err instanceof jwt.TokenExpiredError) {
            throw new HttpError(403, "Access token expired.");
          }
          throw new HttpError(401, "Invalid access token.");
        }
        const user = await userModel.findById(data._id);
        if (!user) {
          throw new HttpError(401, "User not found.");
        }
        if (!user.isVerified) {
          throw new HttpError(401, "User not verified.");
        }
        req.user = data;
        next();
      } catch (e) {
        next(e);
      }
    });
  } catch (e) {
    next(e);
  }
};

module.exports = authorizeUser;
