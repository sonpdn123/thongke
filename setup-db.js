const { Client } = require('pg');


// Thay thế chuỗi thật bằng chữ mẫu này để GitHub cho phép qua cửa
const connectionString = 'postgres://avnadmin:da_xoa_mat_khau_bao_mat@host:port/defaultdb';

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Bỏ qua kiểm tra chứng chỉ bảo mật khắt khe
    }
});

async function createTable() {
    try {
        await client.connect();
        console.log("Da ket noi toi Aiven Database thanh cong!");

        const query = `
            CREATE TABLE IF NOT EXISTS daily_income (
                record_date DATE PRIMARY KEY,
                grab INT DEFAULT 0,
                outside INT DEFAULT 0,
                tip INT DEFAULT 0,
                gas INT DEFAULT 0,
                food INT DEFAULT 0,
                total INT DEFAULT 0
            );
        `;

        await client.query(query);
        console.log("Tuyet voi! Da tao bang daily_income thanh cong.");

    } catch (err) {
        console.error("Co loi xay ra:", err.message);
    } finally {
        await client.end(); // Đóng kết nối
    }
}

createTable();