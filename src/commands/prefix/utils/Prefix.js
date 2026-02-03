const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const schema = require("../../../models/PrefixSchema");
const localStorage = require("../../../models/LocalStorage");

module.exports = {
  name: "prefix",
  category: "Util",
  description: "Change prefix settings.",
  args: false,
  usage: "",
  permission: [],
  aliases: [],

  run: async (message, args, client, prefix) => {
    const prefixArgs = args[0];

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `:x: | You don't have \`Manage Guild\` Permissions to use this command.`
            ),
        ],
      });
    }

    if (prefixArgs) {
      if (client.settings.storageType === "mongo") {
        // MongoDB storage
        const Schema = await schema.findOne({
          guildId: message.guild.id,
        });

        if (!Schema) {
          schema.create({ guildId: message.guild.id, prefix: prefixArgs });
        } else {
          Schema.guildId = message.guild.id;
          Schema.prefix = prefixArgs;
          await Schema.save();
        }
      } else {
        // Local JSON storage
        const existingData = await localStorage.findOne({ guildId: message.guild.id });
        if (!existingData) {
          await localStorage.create({ guildId: message.guild.id, prefix: prefixArgs });
        } else {
          await localStorage.save(message.guild.id, prefixArgs);
        }
      }

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `:white_check_mark: | Prefix for this guild has been set to: \`${prefixArgs}\`.`
            ),
        ],
      });
    } else {
      let prefixData;

      if (client.settings.storageType === "mongo") {
        const PrefixSchema = await schema.findOne({
          guildId: message.guild.id,
        });
        prefixData = PrefixSchema ? PrefixSchema.prefix : client.settings.prefix;
      } else {
        const localData = await localStorage.findOne({ guildId: message.guild.id });
        prefixData = localData ? localData.prefix : client.settings.prefix;
      }

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(
              `:gear: | Prefix for this server is set to: \`${prefixData}\`.`
            ),
        ],
      });
    }
  },
};
