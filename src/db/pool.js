const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

if (process.env.NODE_ENV !== "test") {
  module.exports = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  module.exports = new Pool({
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    database: process.env.DB_NAME_TEST,
    password: process.env.DB_PASSWORD_TEST,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}
