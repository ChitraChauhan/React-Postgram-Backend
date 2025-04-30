const mongoose = require("mongoose");
const config = require("../config");

const initDatabaseConnection = async () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const connection = mongoose.connection;

  connection.on("connected", async () => {
    console.log("MongoDB :: Connected");
  });

  connection.on("disconnected", () => {
    console.log("MongoDB :: Disconnected");
  });

  connection.on("error", (error) => {
    console.log(`MongoDB :: Connection error : ${error}`);
    mongoose.disconnect();
    process.exit(1);
  });

  module.exports = connection;
};

module.exports = {
  initDatabaseConnection,
};
