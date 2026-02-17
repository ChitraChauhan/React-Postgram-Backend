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
const allowedOrigins = [
  'http://localhost:3000',  // local frontend
  'https://chitra-react-postgram.netlify.app' // deployed frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow no-origin requests (like curl/postman)
    console.log('origin', origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // only if you're using cookies/auth headers
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // enable pre-flight requests

app.use("/", require("./routes/index"));

app.use(errorHandler);

const server = http.createServer(app);

serverInit();
initDatabaseConnection();

initSocketServer(server);

server.listen(config.port, () => {
  console.log(`Server listing at ${config.port}.`);
});
