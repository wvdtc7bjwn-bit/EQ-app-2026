const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

let pool = null;

function isDatabaseEnabled() {
  return Boolean(DATABASE_URL);
}

function getPool() {
  if (!isDatabaseEnabled()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "false"
          ? false
          : { rejectUnauthorized: false }
    });

    pool.on("error", error => {
      console.error("PostgreSQL pool error:", error);
    });
  }

  return pool;
}

async function query(text, params = []) {
  const currentPool = getPool();

  if (!currentPool) {
    return null;
  }

  return currentPool.query(text, params);
}

async function closeDatabase() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}

module.exports = {
  isDatabaseEnabled,
  getPool,
  query,
  closeDatabase
};
