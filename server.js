const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

console.log("Trang thai DATABASE_URL:", process.env.DATABASE_URL ? "Da thiet lap" : "Chua thiet lap (RONG)");

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
                total INT DEFAULT 0
            );
        `);
        console.log("Kiem tra va san sang bang daily_income!");
    } catch (err) {
        console.error("Loi khi tao bang:", err);
    }
};

app.get('/api/income', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT TO_CHAR(record_date, 'YYYY-MM-DD') as record_date, 
                   grab, outside, tip, gas, food, total 
            FROM daily_income
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Loi khi lay du lieu:", err); 
        res.status(500).json({ error: "Loi Server" });
    }
});

app.post('/api/income', async (req, res) => {
    const { record_date, grab, outside, tip, gas, food, total } = req.body;
    try {
        const query = `
            INSERT INTO daily_income (record_date, grab, outside, tip, gas, food, total)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (record_date) 
            DO UPDATE SET 
                grab = EXCLUDED.grab, 
                outside = EXCLUDED.outside, 
                tip = EXCLUDED.tip, 
                gas = EXCLUDED.gas, 
                food = EXCLUDED.food, 
                total = EXCLUDED.total;
        `;
        await pool.query(query, [record_date, grab, outside, tip, gas, food, total]);
        res.json({ message: 'Luu thong tin thanh cong' });
    } catch (err) {
        console.error("Loi khi ghi du lieu:", err); 
        res.status(500).json({ error: "Loi Server" });
    }
});

app.delete('/api/income/:date', async (req, res) => {
    try {
        await pool.query('DELETE FROM daily_income WHERE record_date = $1', [req.params.date]);
        res.json({ message: 'Xoa thong tin thanh cong' });
    } catch (err) {
        console.error("Loi khi xoa du lieu:", err); 
        res.status(500).json({ error: "Loi Server" });
    }
});

const PORT = process.env.PORT || 3000;

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server dang chay tren port ${PORT}`);
    });
});