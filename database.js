const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./shop.db', (err) => {
    if (err) console.error("Lỗi Database:", err);
    else console.log("Kết nối SQLite thành công.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        balance INTEGER DEFAULT 0,
        role TEXT DEFAULT 'CUSTOMER'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        price INTEGER,
        status TEXT DEFAULT 'AVAILABLE'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount INTEGER,
        type TEXT,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`INSERT OR IGNORE INTO users (id, username, password, balance, role) VALUES (1, 'admin', '123', 0, 'ADMIN')`);
    db.run(`INSERT OR IGNORE INTO users (id, username, password, balance) VALUES (2, 'player1', '123', 500000)`);
    db.run(`INSERT OR IGNORE INTO products (id, title, price) VALUES (1, 'Acc VIP - Full Skin', 200000)`);
    db.run(`INSERT OR IGNORE INTO products (id, title, price) VALUES (2, 'Acc Clone - Có Yasuo', 50000)`);
});

module.exports = db;
