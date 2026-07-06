const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Set to console.log to see the raw SQL queries
    define: {
      hooks: {
        beforeValidate: (instance, options) => {
          if (instance && instance.dataValues) {
            for (const key of Object.keys(instance.dataValues)) {
              if (
                key === 'password_hash' ||
                key.endsWith('_file') ||
                key.endsWith('_url')
              ) {
                continue;
              }
              const val = instance.dataValues[key];
              if (typeof val === 'string') {
                instance.dataValues[key] = val.toUpperCase();
              }
            }
          }
        },
        beforeBulkCreate: (instances, options) => {
          for (const instance of instances) {
            if (instance && instance.dataValues) {
              for (const key of Object.keys(instance.dataValues)) {
                if (
                  key === 'password_hash' ||
                  key.endsWith('_file') ||
                  key.endsWith('_url')
                ) {
                  continue;
                }
                const val = instance.dataValues[key];
                if (typeof val === 'string') {
                  instance.dataValues[key] = val.toUpperCase();
                }
              }
            }
          }
        }
      }
    }
  }
);

module.exports = sequelize;
