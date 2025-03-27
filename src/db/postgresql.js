import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database on OCI");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing query", { text, error });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const done = () => {
    client.release();
  };
  return { client, done };
};

export default { query, getClient };
