const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'Circular',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

