const SlashCommand = require("../../../structures/SlashCommand");
const { EmbedBuilder, MessageFlags } = require("discord.js");

const command = new SlashCommand()
  .setName("resume")
  .setDescription("Resume current playing track.")
  .setCategory("Music")
  .setRun(async (client, interaction, options) => {
    const player = client.manager.players.get(interaction.guild.id);

    if (!player) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(`:x: | The queue is empty.`),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.member.voice.channel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `:x: | You need to be in a voice channel to use this command.`
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      interaction.guild.members.me.voice.channel &&
      !interaction.guild.members.me.voice.channel.equals(
        interaction.member.voice.channel
      )
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              `:x: | You need to be in the same voice channel as the bot to use this command.`
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!player.paused) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(
              `:x: | The current track is already resumed.`
            )
        ],
        flags: MessageFlags.Ephemeral,
      })
    }

    if (!player.current) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.embedColor)
            .setDescription(`:x: | No track is currently playing. Use the play command to add songs to the queue.`),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    await player.pause(false);
    let song = player.current;

    // Update the Now Playing message button to show pause emoji
    try {
      const nowPlayingMessage = client.playerHandler.nowPlayingMessages.get(interaction.guild.id);
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
          .setEmoji("⏸️"); // Pause emoji since we just resumed

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

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.embedColor)
          .setDescription(
            `:white_check_mark: | Resumed playing: [\`${song.info.title}\`](${song.info.uri})`
          ),
      ],
    });
  });

module.exports = command;
