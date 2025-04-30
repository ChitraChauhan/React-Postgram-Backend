const express = require("express");
const http = require("http");
const cors = require("cors");

const config = require("./config");
const errorHandler = require("./utils/errorHandler");
const { serverInit } = require("./utils/serverInit");
const { initDatabaseConnection } = require("./utils/dbConnection");
const { initSocketServer } = require("./utils/socketServer");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL, // Allow requests from Netlify frontend
  credentials: true
}));

app.use("/", require("./routes/index"));

app.use(errorHandler);

const server = http.createServer(app);

serverInit();
initDatabaseConnection();

initSocketServer(server);

server.listen(config.port, () => {
  console.log(`Server listing at ${config.port}.`);
});
