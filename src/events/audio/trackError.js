const { EmbedBuilder } = require("discord.js");

module.exports = async (client, player, track, error) => {
  const channel = client.channels.cache.get(player.textChannel);
  let song = player.current.info;
  channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor("Red")
        .setDescription(`:x: | Track error: [\`${song.title}\`](${song.uri}).`),
    ],
  });
  const guild = await client.guilds.fetch(player.guildId);
  client.node.warn(
    `Track error [${song.title}] in Player: [${guild.name}] (${player.guildId})`
  );

  // Log error to Discord
  // Create an error object if one doesn't exist
  const trackError = error || {
    message: `Track error occurred for: ${song.title}`,
    code: 'TRACK_ERROR',
    stack: `Track: ${song.title}\nURI: ${song.uri}\nPlayer: ${player.guildId}`
  };

  await client.logErrorToDiscord(
    trackError,
    `Track Error: ${song.title} in ${guild.name} (${player.guildId})`
  );
};
