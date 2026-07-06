require('dotenv').config();
const { sequelize } = require('./models');
const express = require('express');
const app = express();

sequelize.sync({ force: false }).then(() => {
  console.log('DB synced');
  app.listen(5002, () => console.log('Listening on 5002'));
});
