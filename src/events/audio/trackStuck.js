const { EmbedBuilder } = require("discord.js");

module.exports = async (client, player, track, error) => {
  const channel = client.channels.cache.get(player.textChannel);
  let song = player.current.info;
  channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          `:x: | Track stucked: [\`${song.title}\`](${song.uri}).`
        ),
    ],
  });
  const guild = await client.guilds.fetch(player.guildId);
  client.node.warn(
    `Track stucked [${song.title}] in Player: [${guild.name}] (${player.guildId})`
  );

  // Log error to Discord
  const trackError = error || {
    message: `Track stuck occurred for: ${song.title}`,
    code: 'TRACK_STUCK',
    stack: `Track: ${song.title}\nURI: ${song.uri}\nPlayer: ${player.guildId}`
  };

  await client.logErrorToDiscord(
    trackError,
    `Track Stuck: ${song.title} in ${guild.name} (${player.guildId})`
  );

  await player.stop();
};
