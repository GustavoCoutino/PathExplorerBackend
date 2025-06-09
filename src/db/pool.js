const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

let pool;

if (process.env.NODE_ENV !== "test") {
  pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    database: process.env.DB_NAME_TEST,
    password: process.env.DB_PASSWORD_TEST,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

// ✅ Agregar métodos para transacciones
const query = (text, params) => pool.query(text, params);

const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Wrapper para transacciones
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  getClient,
  withTransaction,
  pool,
};
