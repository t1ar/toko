const { Pool } = require('pg');

const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'toko',
  password: 'yes',
  port: 5432,
});

module.exports = db;