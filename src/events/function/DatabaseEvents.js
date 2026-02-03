const mongoose = require("mongoose");

module.exports = {
  name: "clientReady",
  run: async (client, message) => {
    // Only connect to MongoDB if storage type is set to "mongo"
    if (client.settings.storageType === "mongo") {
      if (!client.settings.mongoUrl) {
        client.bot.warn("MongoDB URL not provided but storage type is set to 'mongo'. Switching to local storage.");
        client.settings.storageType = "local";
        client.bot.info("Using local JSON storage for prefixes.");
        return;
      }

      mongoose.connect(client.settings.mongoUrl);
      mongoose.Promise = global.Promise;
      mongoose.set("strictQuery", true);
      mongoose.connection.on("connected", () => {
        client.bot.info(
          "Database connection connected. MongoDB is ready.",
          "ready"
        );
      });
      mongoose.connection.on("err", (err) => {
        client.bot.error(
          `Database connection error. MongoDB-01 is not ready.`,
          "error"
        );
      });
      mongoose.connection.on("disconnected", () => {
        client.bot.warn(
          "Database connection disconnected. MongoDB-01 is disconnected."
        );
      });
    } else {
      client.bot.info("Using local JSON storage for prefixes.");
    }
  },
};
