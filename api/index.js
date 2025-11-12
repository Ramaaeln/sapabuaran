const serverless = require('serverless-http');
const app = require('../src/app'); // import Express app kamu

module.exports.handler = serverless(app);
