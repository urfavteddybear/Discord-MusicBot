const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "pause",
  category: "Music",
  description: "Pause current playing track.",
  args: false,
  usage: "",
  permission: [],
  aliases: [],

  run: async (message, args, client, prefix) => {
    const player = client.manager.players.get(message.guild.id);

    if (!player) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(`:x: | The queue is empty.`),
        ],
      });
    }

    if (!player.current) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(`:x: | No track is currently playing. Use the play command to add songs to the queue.`),
        ],
      });
    }

    if (!message.member.voice.channel) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `:x: | You need to be in a voice channel to use this command.`
            ),
        ],
      });
    }

    if (
      message.guild.members.me.voice.channel &&
      !message.guild.members.me.voice.channel.equals(
        message.member.voice.channel
      )
    ) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `:x: | You need to be in the same voice channel as the bot to use this command.`
            ),
        ],
      });
    }

    await player.pause(true);
    let song = player.current;

    // Update the Now Playing message button to show resume emoji
    try {
      const nowPlayingMessage = client.playerHandler.nowPlayingMessages.get(message.guild.id);
      if (nowPlayingMessage) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

        const prevButton = new ButtonBuilder()
          .setCustomId("previous_interaction")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!player.previous)
          .setEmoji("⏮️");

        const pauseButton = new ButtonBuilder()
          .setCustomId("pause_interaction")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("▶️"); // Resume emoji since we just paused

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

        await nowPlayingMessage.edit({ components: [row] }).catch(() => { });
      }
    } catch (error) {
      // Silently fail if message update fails
    }

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.embedColor)
          .setDescription(
            `:white_check_mark: | Paused: [\`${song.info.title}\`](${song.info.uri})`
          ),
      ],
    });
  },
};
