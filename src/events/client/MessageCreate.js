const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../models/PrefixSchema");
const localStorage = require("../../models/LocalStorage");
const { UpdateChecker } = require("../../structures/UpdateChecker");

module.exports = {
  name: "messageCreate",
  run: async (client, message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    let prefix = client.settings.prefix;

    // Use appropriate storage method based on config
    if (client.settings.storageType === "mongo") {
      const schema = await db.findOne({ guildId: message.guild.id });
      if (schema) {
        prefix = schema.prefix;
      }
    } else {
      const localData = await localStorage.findOne({ guildId: message.guild.id });
      if (localData) {
        prefix = localData.prefix;
      }
    }

    const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);
    if (message.content.match(mention)) {
      const embed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setDescription(
          `My prefix in this server is <@${client.user.id}>, \`${prefix}\`, \`/\` (Slash Command).`
        );
      message.channel.send({ embeds: [embed] });
      return;
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(
      `^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`
    );

    if (!prefixRegex.test(message.content)) return;

    const [matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content
      .slice(matchedPrefix.length)
      .trim()
      .split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command =
      client.PrefixCommands.get(commandName) ||
      client.PrefixCommands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) return;

    if (
      !message.guild.members
        .resolve(client.user)
        .permissions.has(PermissionFlagsBits.SendMessages)
    ) {
      return message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `:x: | I don't have \`Send Message\` Permission to send message in this server`
            ),
        ],
      });
    }

    if (
      !message.guild.members
        .resolve(client.user)
        .permissions.has(PermissionFlagsBits.AttachFiles)
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `:x: | I don't have \`Attach Files\` Permission to send message in this server`
            ),
        ],
      });
    }

    if (
      !message.channel
        .permissionsFor(client.user)
        .has(PermissionFlagsBits.SendMessages)
    ) {
      return message.author.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `:x: | I don't have \`Send Message\` Permission to send message in this server`
            ),
        ],
      });
    }

    if (
      !message.channel
        .permissionsFor(client.user)
        .has(PermissionFlagsBits.AttachFiles)
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `:x: | I don't have \`Attach Files\` Permission to send message in this server`
            ),
        ],
      });
    }

    if (message.author.id === client.config.ownerId) {
      UpdateChecker(message);
    }

    if (command.owner && message.author.id !== client.config.ownerId) {
      return;
    }

    try {
      command.run(message, args, client, prefix);
      client.commandRan++;
    } catch (error) {
      client.bot.error(`Error executing command ${commandName}: ${error.message}`);
      console.error(error);
      
      // Log error to Discord
      await client.logErrorToDiscord(
        error,
        `Command Error: ${prefix}${commandName} in ${message.guild.name} (${message.guild.id})`
      );

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`:x: | An error occurred while executing this command. The error has been logged.`);

      await message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
  },
};
