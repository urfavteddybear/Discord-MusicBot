const { EmbedBuilder } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
  name: "nodes",
  category: "Util",
  description: "See latest node status.",
  args: false,
  usage: "",
  permission: [],
  aliases: ["node", "ll"],

  run: async (message, args, client, prefix) => {
    await message.reply({
      content: `\`🟢 Active Node | ⚪ Available | 🔴 Disconnected\``,
    });

    const prettyBytes = (await import("pretty-bytes")).default;
    const player = client.manager.players.get(message.guild.id);
    let colors;
    client.manager.nodeMap.forEach((x) => {
      // Check if node is connected first
      if (!x.connected) {
        colors = "-"; // Red for disconnected
      } else if (player && player.node.name == x.name) {
        colors = "+"; // Green for active node
      } else {
        colors = " "; // White/neutral for available but not active
      }

      const lavauptime = x.stats ? moment
        .duration(x.stats.uptime)
        .format(" d [days], h [hours], m [minutes]") : "N/A";

      // Handle cases where stats might not be available for disconnected nodes
      const nodeStats = x.stats || { cpu: { cores: 0 }, memory: { used: 0, reservable: 0 }, playingPlayers: 0, players: 0 };
      
      let msg = new EmbedBuilder().setColor(client.embedColor)
        .setDescription(`\`\`\`diff\n
${colors} ID      :: ${x.name}
${colors} State   :: ${x.connected ? "Connected" : "Disconnected"}
${colors} Core    :: ${nodeStats.cpu.cores} Core(s)
${colors} Memory  :: ${x.stats ? `${prettyBytes(nodeStats.memory.used)}/${prettyBytes(nodeStats.memory.reservable)}` : "N/A"}
${colors} Uptime  :: ${lavauptime}
${colors} Players :: ${nodeStats.playingPlayers}/${nodeStats.players}\`\`\``);

      return message.channel
        .send({
          embeds: [msg],
        })
        .catch(console.log);
    });
  },
};
