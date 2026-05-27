const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Luồng xử lý dữ liệu: Cho phép đọc dữ liệu JSON gửi từ Frontend lên
app.use(express.json());

// Cấu hình CORS để giao diện Frontend (sau này chạy trên Vercel) có thể gọi được API này
app.use(cors({
    origin: '*'
}));

// Cấu hình kết nối Database sử dụng biến môi trường (Environment Variable) để bảo mật
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Bỏ qua xác thực SSL giống như file setup-db
    }
});

// API 1: Lấy toàn bộ dữ liệu thu nhập để hiển thị lên lịch (Phương thức GET)
app.get('/api/income', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT TO_CHAR(record_date, 'YYYY-MM-DD') as record_date, 
                   grab, outside, tip, gas, food, total 
            FROM daily_income
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 2: Lưu hoặc cập nhật dữ liệu khi bấm nút Lưu trên Form (Phương thức POST)
app.post('/api/income', async (req, res) => {
    const { record_date, grab, outside, tip, gas, food, total } = req.body;
    try {
        const query = `
            INSERT INTO daily_income (record_date, grab, outside, tip, gas, food, total)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (record_date) 
            DO UPDATE SET grab = $2, outside = $3, tip = $4, gas = $5, food = $6, total = $7;
        `;
        await pool.query(query, [record_date, grab, outside, tip, gas, food, total]);
        res.json({ message: 'Luu thong tin thanh cong' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 3: Xóa dữ liệu của một ngày cụ thể khi bấm nút Xóa (Phương thức DELETE)
app.delete('/api/income/:date', async (req, res) => {
    try {
        await pool.query('DELETE FROM daily_income WHERE record_date = $1', [req.params.date]);
        res.json({ message: 'Xoa thong tin thanh cong' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cấu hình Port linh hoạt cho Render tự động cấp phát
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server dang chay tren port ${PORT}`);
});