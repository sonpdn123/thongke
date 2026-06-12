const express = require('express');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const connectionString = process.env.DATABASE_URL;

app.get('/ping-db', async (req, res) => {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    res.status(200).send('Database is active!');
  } catch (err) {
    res.status(500).send('Database connection failed: ' + err.message);
  } finally {
    await client.end();
  }
});

app.listen(port, () => {
  console.log(`Server đang chạy tại port ${port}`);
});