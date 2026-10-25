const express = require('express');
const dbModule = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = "BI_MAT_CUA_SHOP_123"; // Đổi thành chuỗi bí mật của mày

// Hàm kiểm tra đăng nhập
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Chưa đăng nhập" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Phiên đăng nhập hết hạn" });
        req.user = user;
        next();
    });
};

dbModule.initDB().then(() => {
    const db = dbModule;

    // API Đăng ký
    app.post('/api/register', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Thiếu thông tin" });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], (err) => {
            if (err) return res.status(400).json({ error: "Tài khoản đã tồn tại" });
            res.json({ success: true, message: "Đăng ký thành công!" });
        });
    });

    // API Đăng nhập
    app.post('/api/login', (req, res) => {
        const { username, password } = req.body;
        db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
            if (err || !user) return res.status(400).json({ error: "Sai tài khoản hoặc mật khẩu" });

            const validPass = await bcrypt.compare(password, user.password);
            if (!validPass) return res.status(400).json({ error: "Sai tài khoản hoặc mật khẩu" });

            // Tạo token (lưu thông tin user vào token)
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ success: true, token: token, user: { username: user.username, balance: user.balance } });
        });
    });

    // API Lấy thông tin cá nhân (Cần đăng nhập)
    app.get('/api/me', authenticateToken, (req, res) => {
        db.get(`SELECT balance, username FROM users WHERE id = ?`, [req.user.id], (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ user: user });
        });
    });

    // API Lấy danh sách Acc
    app.get('/api/products', (req, res) => {
        db.all(`SELECT * FROM products`, [], (err, products) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ products: products });
        });
    });

    // API Mua Acc (Cần đăng nhập)
    app.post('/api/buy', authenticateToken, (req, res) => {
        const { productId } = req.body;
        const userId = req.user.id; 

        db.get(`SELECT * FROM products WHERE id = ? AND status = 'AVAILABLE'`, [productId], (err, product) => {
            if (err || !product) return res.status(400).json({ error: "Sản phẩm đã bán!" });

            db.get(`SELECT balance FROM users WHERE id = ?`, [userId], (err, user) => {
                if (user.balance < product.price) return res.status(400).json({ error: "Số dư không đủ!" });

                const newBalance = user.balance - product.price;
                db.run(`UPDATE users SET balance = ? WHERE id = ?`, [newBalance, userId]);
                db.run(`UPDATE products SET status = 'SOLD' WHERE id = ?`, [productId]);

                res.json({ success: true, message: "Mua thành công!", newBalance: newBalance });
            });
        });
    });

    app.listen(3000, () => console.log('Server chạy tại cổng 3000'));
}).catch(err => console.error("Lỗi DB:", err));