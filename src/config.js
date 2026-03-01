const { ActivityType } = require("discord.js");
require("dotenv").config();

module.exports = {
  bot: {
    token: process.env.token || "", // Bot token
    clientName: process.env.clientUsername || "", // Bot username
    clientId: process.env.clientId || "", // Bot clientId
    clientSecret: process.env.clientSecret || "", // Bot clientSecret
  },

  owner: {
    userId: process.env.userId || "", // Owner userId for developer command
    updateChecker: true, // Check for latest update. set to false if you dont want to check for latest update
  },

  botSettings: {
    storageType: process.env.storageType || "local", // Storage type: "mongo" for MongoDB, "local" for JSON file
    mongoUrl: process.env.mongoUrl || "", // Mongodb url for database
    geniusToken: process.env.geniusToken || "", // Genius token use to fetch lyrics, you can leave it blank.
    spotifyClientId: process.env.spotifyClientId || "", // Spotify Client ID for Spotify support
    spotifyClientSecret: process.env.spotifyClientSecret || "", // Spotify Client Secret for Spotify support
    prefix: process.env.prefix || "?", // Default prefix is set to "?" use prefix command to change
    embedColor: process.env.embedColor || "2F3136", // You can use any HEX Color but without the "#"
  },

  // Error Logging Configuration
  errorLog: {
    enabled: process.env.errorLogEnabled === "true" ? true : (process.env.errorLogEnabled === "false" ? false : true), // Set to true to enable error logging to Discord channel
    channelId: process.env.errorLogChannelId || "", // Channel ID where error logs will be sent
  },

  // Lavalink settings. Please use lavalink v4
  // You can remove docker-node if youre not using docker to run the bot.
  nodes: [
    {
      name: "Private",
      host: "100.99.1.3",
      password: "youshallnotpass",
      port: 2333,
      secure: false,
    },
  ],

  // Client Presence
  presence: {
    activities: [
      {
        name: "/play",
        type: ActivityType.Listening,
      },
    ],
    status: "online",
  },
};
