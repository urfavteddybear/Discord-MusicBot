const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = async (client, player, track) => {
  const user = await client.users.fetch(track.info.requester);
  const username = user.username || "Unknown";

  // Create embed instead of canvas image
  const embed = new EmbedBuilder()
    .setColor(client.embedColor)
    .setTitle("🎵 Now Playing")
    .setDescription(`**[${track.info.title}](${track.info.uri})**\nby ${track.info.author}`)
    .addFields(
      { name: "Requested by", value: `${track.info.requester}`, inline: true },
      { name: "Duration", value: track.info.isStream ? "`🔴 Live`" : `\`${Math.floor(track.info.length / 60000)}:${Math.floor((track.info.length % 60000) / 1000).toString().padStart(2, '0')}\``, inline: true },
      { name: "Source", value: track.info.sourceName.charAt(0).toUpperCase() + track.info.sourceName.slice(1), inline: true }
    )
    .setTimestamp();

  // Set thumbnail if available
  if (track.info.thumbnail) {
    embed.setThumbnail(track.info.thumbnail);
  }

  const prevButton = new ButtonBuilder()
    .setCustomId("previous_interaction")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(!player.previous)
    .setEmoji("⏮️");

  const pauseButton = new ButtonBuilder()
    .setCustomId("pause_interaction")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⏸️");

  const nextButton = new ButtonBuilder()
    .setCustomId("skip_interaction")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("⏭️");

  const shuffleButton = new ButtonBuilder()
    .setCustomId("shuffle_interaction")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("🔀");
    
  const stopButton = new ButtonBuilder()
    .setCustomId("stop_interaction")
    .setStyle(ButtonStyle.Danger)
    .setEmoji("⏹️");



  const row = new ActionRowBuilder().addComponents([prevButton, pauseButton, nextButton, shuffleButton, stopButton]);

  let message;

  message = await client.channels.cache
    .get(player.textChannel)
    .send({ embeds: [embed], components: [row] })
    .catch((error) => {
      client.bot.error("Error sending message:", error);
    });

  const guild = await client.guilds.fetch(player.guildId);

  client.node.info(
    `Track has been started playing [${track.info.title}] in Player: [${guild.name}] (${player.guildId})`
  );
  client.musicPlay++;

  try {
    client.playerHandler.setNowPlayingMessage(player.guildId, message);
  } catch (error) {
    client.bot.error("Failed to set trackStart message:", error);
  }

  const collecter = message.createMessageComponentCollector({
    time: track.current,
  });

  collecter.on("collect", async (i) => {
    let player = client.manager.players.get(i.guild.id);
    if (i.customId === "pause_interaction") {
      if (player.paused === false) {
        pauseButton.setEmoji("⏸️");
        message.edit({
          components: [row],
        });
      } else {
        pauseButton.setEmoji("▶️");
        message.edit({
          components: [row],
        });
      }
    }
  });
};
