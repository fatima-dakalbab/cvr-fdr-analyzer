const fs = require('fs/promises');
const path = require('path');

const pool = require('./pool');

let initialized = false;

const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');

const initializeDatabase = async () => {
  if (initialized) {
    return;
  }

  const client = await pool.connect();

  try {
    const schema = await fs.readFile(schemaPath, 'utf8');
    await client.query(schema);
    initialized = true;
  } finally {
    client.release();
  }
};

module.exports = initializeDatabase;