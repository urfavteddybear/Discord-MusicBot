module.exports = async (client, node) => {
  client.node.info(`Node: ${node.name} => ${node.name} is reconnecting.`);
};
