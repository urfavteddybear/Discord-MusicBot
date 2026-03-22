const { Client, GatewayIntentBits, Collection, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Muthera } = require("muthera");
const { readdirSync } = require("fs");
const logger = require("../utils/Logger");

class MusicBot extends Client {
  constructor() {
    super({
      allowedMentions: {
        repliedUser: false,
        parse: ["roles", "users", "everyone"],
      },
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.config = require("../config");
    this.settings = this.config.botSettings;
    this.embedColor = this.config.botSettings.embedColor;
    this.owner = this.config.owner;
    this.cmdDisconnect = false;
    this.commandRan = 0;
    this.musicPlay = 0;
    this.clientEvents = 0;
    this.nodeEvents = 0;
    this.commandSize = 0;
    this.bot = logger.createLogger("CLIENT");
    this.node = logger.createLogger("NODE");
    this.SlashCommands = new Collection();
    this.PrefixCommands = new Collection();
    this.ContextCommands = new Collection();

    this.manager = new Muthera(this, this.config.nodes, {
      send: (payload) => {
        const guild = this.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
      },
      defaultSearchPlatform: "spsearch",
      reconnectTimeout: 10000,
      reconnectTries: 50,
      resumeKey: null,
      resumeTimeout: 60,
      spotifyClientId: this.config.botSettings.spotifyClientId || null,
      spotifyClientSecret: this.config.botSettings.spotifyClientSecret || null,
    });

    // Error logging utility
    this.logErrorToDiscord = async (error, context = "Unknown") => {
      if (!this.config.errorLog.enabled || !this.config.errorLog.channelId) {
        return;
      }

      try {
        const channel = await this.channels.fetch(this.config.errorLog.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
          return;
        }

        const { EmbedBuilder } = require("discord.js");
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("🚨 Error Detected")
          .addFields(
            { name: "Context", value: `\`\`\`${context}\`\`\``, inline: false },
            { name: "Error Message", value: `\`\`\`${error.message || 'Unknown error'}\`\`\``, inline: false },
            { name: "Error Code", value: `\`\`\`${error.code || 'N/A'}\`\`\``, inline: true },
            { name: "Timestamp", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
          )
          .setTimestamp();

        if (error.stack) {
          const stackTrace = error.stack.length > 1000
            ? error.stack.substring(0, 1000) + "..."
            : error.stack;
          errorEmbed.addFields({
            name: "Stack Trace",
            value: `\`\`\`${stackTrace}\`\`\``,
            inline: false
          });
        }

        await channel.send({ embeds: [errorEmbed] });
      } catch (err) {
        this.bot.error(`Failed to send error log to Discord: ${err.message}`);
      }
    };

    // Error handler
    process.on("unhandledRejection", async (error) => {
      if (error.code === 50001) {
        this.bot.error("Missing Access. Please check bot permissions.");
        await this.logErrorToDiscord(error, "UnhandledRejection - Missing Access");
        return;
      }

      // Handle node connection errors gracefully
      if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
        this.bot.warn(`Node connection failed: ${error.message}`);
        this.bot.warn('Bot will continue operating with available nodes.');
        return;
      }

      if (error.code !== 40060 && error.code !== 10008) {
        this.bot.error(
          `An error has been detected by system => errorType: UnhandledRejection.`
        );
        console.log(error);
        await this.logErrorToDiscord(error, "UnhandledRejection");
      }
    });

    process.on("uncaughtException", async (error) => {
      if (error.code === 50001) {
        this.bot.error("Missing Access. Please check bot permissions.");
        await this.logErrorToDiscord(error, "UncaughtException - Missing Access");
        return;
      }

      // Handle node connection errors gracefully
      if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
        this.bot.warn(`Node connection failed: ${error.message}`);
        this.bot.warn('Bot will continue operating with available nodes.');
        return;
      }

      if (error.code !== 40060 && error.code !== 10008) {
        this.bot.error(
          `An error has been detected by system => errorType: uncaughtException.`
        );
        console.log(error);
        await this.logErrorToDiscord(error, "UncaughtException");
      }
    });

    // Load events
    readdirSync("./events/client/").forEach((file) => {
      const event = require(`../events/client/${file}`);
      let eventName = file.split(".")[0];
      this.on(event.name, (...args) => event.run(this, ...args));
      this.clientEvents++;
    });

    // Load autocomplete
    readdirSync("./events/autocomplete/").forEach((file) => {
      const event = require(`../events/autocomplete/${file}`);
      let eventName = file.split(".")[0];
      this.on(event.name, (...args) => event.run(this, ...args));
      this.clientEvents++;
    });

    // Load function
    readdirSync("./events/function/").forEach((file) => {
      const event = require(`../events/function/${file}`);
      let eventName = file.split(".")[0];
      this.on(event.name, (...args) => event.run(this, ...args));
      this.clientEvents++;
    });

    // Load node events
    readdirSync("./events/node/").forEach((file) => {
      const event = require(`../events/node/${file}`);
      let eventName = file.split(".")[0];
      this.manager.on(eventName, event.bind(null, this));
      this.nodeEvents++;
    });

    // Load audio event
    readdirSync("./events/audio/").forEach((file) => {
      const event = require(`../events/audio/${file}`);
      let eventName = file.split(".")[0];
      this.manager.on(eventName, event.bind(null, this));
      this.nodeEvents++;
    });

    // Load slash commands
    readdirSync("./commands/slash/").forEach((dir) => {
      const slashCommandFiles = readdirSync(`./commands/slash/${dir}/`).filter(
        (f) => f.endsWith(".js")
      );
      for (const file of slashCommandFiles) {
        const command = require(`../commands/slash/${dir}/${file}`);
        this.SlashCommands.set(command.name, command);
        this.commandSize++;
      }
    });

    // Load prefix commands
    readdirSync("./commands/prefix/").forEach((dir) => {
      const prefixCommandFiles = readdirSync(
        `./commands/prefix/${dir}/`
      ).filter((f) => f.endsWith(".js"));
      for (const file of prefixCommandFiles) {
        const command = require(`../commands/prefix/${dir}/${file}`);
        this.PrefixCommands.set(command.name, command);
        this.commandSize++;
      }
    });

    // Load context menu commands
    readdirSync("./commands/context").forEach((dir) => {
      const contextMenuFiles = readdirSync(`./commands/context/${dir}/`).filter(
        (f) => f.endsWith(".js")
      );
      for (const file of contextMenuFiles) {
        const command = require(`../commands/context/${dir}/${file}`);
        this.ContextCommands.set(file.split(".")[0], command);
        this.commandSize++;
      }
    });
  }

  async connect() {
    await this.registerSlashCommands(); // Register slash commands before logging in
    this.bot.info(`Load ${this.clientEvents} Client Events`);
    this.bot.info(`Load ${this.commandSize} Commands.`);
    this.node.info(`Load ${this.nodeEvents} Node Events`);
    return super.login(this.config.bot.token);
  }

  async registerSlashCommands() {
    const rest = new REST({ version: "10" }).setToken(this.config.bot.token);

    const slashCommands = this.SlashCommands.map((command) => ({
      name: command.name,
      description: command.description,
      options: command.options,
    }));

    const contextCommands = this.ContextCommands.map((command) => ({
      name: command.command.name,
      type: command.command.type,
      default_permission: command.command.defaultPermission,
      options: command.command.options,
    }));

    const allCommands = [...slashCommands, ...contextCommands];

    try {
      this.bot.info("Started refreshing application (/) commands.");

      await rest.put(Routes.applicationCommands(this.config.bot.clientId), {
        body: allCommands,
      });

      this.bot.info("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = MusicBot;
