const initSqlJs = require('sql.js');
const fs = require('fs');

let db;

// Hàm khởi tạo Database bất đồng bộ
async function initDB() {
    const SQL = await initSqlJs();
    let dbFile = null;
    if (fs.existsSync('./shop.db')) {
        dbFile = fs.readFileSync('./shop.db');
    }
    db = new SQL.Database(dbFile);

    // Tạo bảng
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, balance INTEGER DEFAULT 0, role TEXT DEFAULT 'CUSTOMER')`);
    db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, title TEXT, price INTEGER, status TEXT DEFAULT 'AVAILABLE')`);
    
    // Insert data mẫu
    db.run(`INSERT OR IGNORE INTO users (id, username, password, balance, role) VALUES (1, 'admin', '123', 0, 'ADMIN')`);
    db.run(`INSERT OR IGNORE INTO users (id, username, password, balance) VALUES (2, 'player1', '123', 500000)`);
    db.run(`INSERT OR IGNORE INTO products (id, title, price) VALUES (1, 'Acc VIP - Full Skin', 200000)`);
    db.run(`INSERT OR IGNORE INTO products (id, title, price) VALUES (2, 'Acc Clone - Có Yasuo', 50000)`);
    
    saveDB();
}

function saveDB() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync('./shop.db', buffer);
}

// Hàm giả lập truy vấn của sqlite3 để code index.js cũ chạy được
function get(query, params, callback) {
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        if (stmt.step()) {
            callback(null, stmt.getAsObject());
        } else {
            callback(null, null);
        }
        stmt.free();
    } catch (e) { callback(e, null); }
}

function all(query, params, callback) {
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) { results.push(stmt.getAsObject()); }
        stmt.free();
        callback(null, results);
    } catch (e) { callback(e, null); }
}

function run(query, params, callback) {
    try {
        db.run(query, params);
        saveDB();
        if (callback) callback(null);
    } catch (e) { if (callback) callback(e); }
}

module.exports = { initDB, get, all, run, getDb: () => db };