const { EmbedBuilder } = require("discord.js");

module.exports = async (client, player) => {
  const channel = client.channels.cache.get(player.textChannel);

  player.set("autoplay", false);

  client.node.warn(
    `Autoplay failed for player in guild: (${player.guildId})`
  );

  if (channel) {
    channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setDescription(
            `:x: | Autoplay failed: could not find a related track. Autoplay has been disabled.`
          ),
      ],
    });
  }

  await player.destroy();
};
