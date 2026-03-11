#!/usr/bin/env node
/**
 * Ensures the MSSQL database exists before running migrations.
 * Connects to 'master' and creates the database if it doesn't exist.
 * SQL Server returns "Login failed" when connecting to a non-existent database.
 */
const dbType = (process.env.DATABASE_TYPE || 'postgres').toLowerCase();
if (dbType !== 'mssql' && dbType !== 'sqlserver') {
  process.exit(0);
}

const sql = require('mssql');

const config = {
  user: process.env.DATABASE_USERNAME || 'sa',
  password: process.env.DATABASE_PASSWORD || '',
  server: process.env.DATABASE_HOST || 'localhost',
  database: 'master',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

const dbName = process.env.DATABASE_NAME || 'track_io';

async function ensureDatabase() {
  const conn = await sql.connect(config);
  try {
    const result = await conn.request().query(
      `SELECT name FROM sys.databases WHERE name = '${dbName.replace(/'/g, "''")}'`
    );
    if (result.recordset.length === 0) {
      await conn.request().query(`CREATE DATABASE [${dbName}]`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database exists: ${dbName}`);
    }
  } finally {
    await conn.close();
  }
}

ensureDatabase().catch((err) => {
  console.error('ensure-mssql-database failed:', err.message);
  process.exit(1);
});
