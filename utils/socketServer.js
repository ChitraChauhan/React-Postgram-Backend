const { Server } = require("socket.io");
const config = require("../config");
const jwt = require("jsonwebtoken");
const userModel = require("../models/users.model");

let io = undefined;
const activeUsers = {};

const addUser = async (socket) => {
  const userData = socket.handshake.headers.userData;
  if (!activeUsers[userData._id]) {
    activeUsers[userData._id] = [];
  }
  activeUsers[userData._id].push(socket.id);
};

const removeUser = async (socket) => {
  const userData = socket.handshake.headers.userData;
  if (activeUsers[userData._id].length > 1) {
    activeUsers[userData._id] = activeUsers[userData._id].filter(
      (id) => socket.id !== id
    );
  } else {
    delete activeUsers[userData._id];
  }
};

const initSocketServer = (httpServer) => {
  try {
    io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });
    io.use(async (socket, next) => {
      const token = socket.handshake.headers.token;
      if (!token) {
        return next(new Error("Token not provided."));
      }
      jwt.verify(token, config.jwtSecret, async (err, data) => {
        if (err) {
          if (err instanceof jwt.TokenExpiredError) {
            return next(new Error("Access token expired."));
          }
          return next(new Error("Invalid access token."));
        }
        const user = await userModel.findById(data._id);
        if (!user) {
          return next(new Error("User not found."));
        }
        if (!user.isVerified) {
          return next(new Error("User not verified."));
        }
        socket.handshake.headers.userData = user;
        return next();
      });
    });

    io.on("connection", async (socket) => {
      await addUser(socket);

      socket.on("disconnecting", async (reason) => {
        await removeUser(socket);
      });
    });
  } catch (e) {
    console.log("Socket Server init fail. Turning off server", e);
    process.exit(1);
  }
};

const eventEmitter = async (event, data, isPrivate = false) => {
  try {
    switch (event) {
      case "new-post":
        if (isPrivate) {
          const userId = data.userId;
          if (activeUsers[userId]) {
            io.to(activeUsers[userId]).emit("new-post", data);
          }
        } else {
          io.emit("new-post", data);
        }
        break;
    }
  } catch (e) {
    return e;
  }
};

module.exports = {
  initSocketServer,
  eventEmitter,
};
