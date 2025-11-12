require('dotenv').config();
const app = require('./src/app');

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running locally on port ${PORT}`));
}

module.exports = app;
