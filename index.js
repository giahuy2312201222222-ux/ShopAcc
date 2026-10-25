const express = require('express');
const dbModule = require('./database');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Khởi động Database rồi mới bật Server
dbModule.initDB().then(() => {
    const db = dbModule;

    app.get('/api/data', (req, res) => {
        const userId = 2; 
        db.get(`SELECT balance, username FROM users WHERE id = ?`, [userId], (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            db.all(`SELECT * FROM products`, [], (err, products) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ user: user, products: products });
            });
        });
    });

    app.post('/api/buy', (req, res) => {
        const { productId } = req.body;
        const userId = 2; 

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

    app.post('/api/deposit', (req, res) => {
        const { amount } = req.body;
        const userId = 2;
        db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: `Đã nạp ${amount} VNĐ` });
        });
    });

    app.listen(3000, () => {
        console.log('Server chạy tại cổng 3000');
    });
}).catch(err => console.error("Lỗi khởi động DB:", err));