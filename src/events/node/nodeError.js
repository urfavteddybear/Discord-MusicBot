module.exports = async (client, node, error) => {
  client.node.warn(`Node: ${node.name} => ${node.name} has an error.`);
  
  // Log error to Discord
  if (error) {
    await client.logErrorToDiscord(
      error,
      `Node Error: ${node.name}`
    );
  }
};
