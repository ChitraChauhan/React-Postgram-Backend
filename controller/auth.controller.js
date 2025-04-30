const userModel = require("../models/users.model");
const bcrypt = require("bcrypt");
const yup = require("yup");
const config = require("../config");
const jwt = require("jsonwebtoken");
const path = require("path");
const {
  firstname,
  lastname,
  email,
  username,
  password,
  isPrivate,
} = require("../utils/validations");
const fs = require("fs");
const { sendVerificationMail } = require("../utils/mailServices");

const CREATE_USER_VALIDATION = yup.object({
  firstname,
  lastname,
  email,
  username,
  password,
  isPrivate,
});

const signUp = async (req, res, next) => {
  try {
    await CREATE_USER_VALIDATION.validate(req.body);
    const userDocument = new userModel({
      ...req.body,
      email: req.body.email.toLowerCase(),
      password: bcrypt.hashSync(req.body.password, 10),
    });
    await userDocument.save();
    const token = jwt.sign(
      {
        userId: userDocument._id,
        email: req.body.email.toLowerCase(),
      },
      config.jwtSecret,
      { expiresIn: "24h" }
    );
    await sendVerificationMail(req.body, token);
    return res.status(201).json({
      status: "success",
      message: "User signed up successfully.",
    });
  } catch (e) {
    next(e);
  }
};

const LOGIN_USER_SCHEMA = yup.object({
  email,
  password,
});

const login = async (req, res, next) => {
  try {
    await LOGIN_USER_SCHEMA.validate(req.body);
    const { email, password } = req.body;
    const user = await userModel
      .findOne(
        { email },
        {
          _id: 1,
          firstname: 1,
          lastname: 1,
          username: 1,
          email: 1,
          password: 1,
          isVerified: 1,
        }
      )
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(403).json({
        status: "error",
        message: "Email or password does not match.",
      });
    }
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ status: "error", message: "Account not verified." });
    }
    delete user.password;
    const accessToken = jwt.sign(user, config.jwtSecret, {
      expiresIn: "24h",
    });
    return res
      .status(200)
      .json({ success: true, data: { ...user, accessToken } });
  } catch (e) {
    next(e);
  }
};

const reSendVerificationMail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email not provided." });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found." });
    }
    if (user.isVerified) {
      return res
        .status(403)
        .json({ status: "error", message: "User already verified." });
    }
    const token = jwt.sign(
      {
        email,
      },
      config.jwtSecret,
      { expiresIn: "24h" }
    );
    await sendVerificationMail(token, email);
  } catch (e) {
    next(e);
  }
};

const verifyAccount = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(404)
        .json({ status: "error", message: "Token not provided" });
    }

    jwt.verify(token, config.jwtSecret, async (err, data) => {
      if (err) {
        res
          .status(404)
          .json({ status: "error", message: "Token is invalid or expired." });
      }
      const user = await userModel.findOne({
        _id: data.userId,
        email: data.email.toLowerCase(),
      });

      if (!user) {
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });
      }

      if (user.isVerified) {
        return res
          .status(200)
          .json({ status: "error", message: "User already verified" });
      }

      user.isVerified = true;
      await user.save();
      return res
        .status(200)
        .json({ status: "success", message: "User verified successfully" });
    });
  } catch (e) {
    next(e);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email not provided" });
    }
    const isDeleted = await userModel.findOneAndDelete({ email });
    if (!isDeleted) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    if (fs.existsSync(path.resolve(__dirname, `../uploads/${isDeleted._id}`))) {
      await fs.rmSync(path.resolve(__dirname, `../uploads/${isDeleted._id}`), {
        recursive: true,
      });
    }
    return res
      .status(200)
      .json({ status: "success", message: "User deleted successfully" });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  signUp,
  login,
  reSendVerificationMail,
  verifyAccount,
  deleteUser,
};
