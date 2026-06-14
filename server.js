const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const compression = require('compression');

const app = express();
app.use(compression());
app.use(express.json());
app.use(cors({ origin: '*' }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_income (
                record_date DATE PRIMARY KEY,
                grab INT DEFAULT 0,
                outside INT DEFAULT 0,
                tip INT DEFAULT 0,
                gas INT DEFAULT 0,
                food INT DEFAULT 0,
                hao_mon INT DEFAULT 0,
                other_expense INT DEFAULT 0,
                total INT DEFAULT 0
            );
        `);
        await pool.query(`
            ALTER TABLE daily_income 
            ADD COLUMN IF NOT EXISTS hao_mon INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS other_expense INT DEFAULT 0;
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_income_record_date ON daily_income(record_date);
        `);
    } catch (err) {
        console.error(err);
    }
};

app.get('/ping', (req, res) => {
    res.status(200).send('OK');
});

app.get('/api/income', async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = `
            SELECT TO_CHAR(record_date, 'YYYY-MM-DD') as record_date, 
                   grab, outside, tip, gas, food, hao_mon, other_expense, total 
            FROM daily_income
        `;
        const params = [];

        if (month && year) {
            query += ` WHERE TO_CHAR(record_date, 'YYYY-MM') = $1`;
            const formattedMonth = String(month).padStart(2, '0');
            params.push(`${year}-${formattedMonth}`);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.post('/api/income', async (req, res) => {
    const { record_date, grab, outside, tip, gas, food, hao_mon, other_expense, total } = req.body;
    try {
        const query = `
            INSERT INTO daily_income (record_date, grab, outside, tip, gas, food, hao_mon, other_expense, total)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (record_date) 
            DO UPDATE SET 
                grab = EXCLUDED.grab, 
                outside = EXCLUDED.outside, 
                tip = EXCLUDED.tip, 
                gas = EXCLUDED.gas, 
                food = EXCLUDED.food, 
                hao_mon = EXCLUDED.hao_mon,
                other_expense = EXCLUDED.other_expense,
                total = EXCLUDED.total;
        `;
        await pool.query(query, [record_date, grab, outside, tip, gas, food, hao_mon, other_expense, total]);
        res.json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.delete('/api/income/:date', async (req, res) => {
    try {
        await pool.query('DELETE FROM daily_income WHERE record_date = $1', [req.params.date]);
        res.json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

const PORT = process.env.PORT || 3000;

initDB().then(() => {
    app.listen(PORT, () => {});
});