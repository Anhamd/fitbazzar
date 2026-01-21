const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// XAMPP Default Configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Default XAMPP password is empty
    database: 'fit_bazaar'
};

// Create connection to MySQL (without selecting a DB first to ensure it exists)
const connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        console.log('Please make sure MySQL is running in XAMPP.');
        return;
    }
    console.log('Connected to MySQL server.');

    // Create database if it doesn't exist
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
        if (err) {
            console.error('Error creating database:', err.message);
            return;
        }
        console.log(`Database "${dbConfig.database}" ready.`);

        // Switch to the database
        connection.query(`USE ${dbConfig.database}`);
        createTables();
    });
});

function createTables() {
    // Products Table
    const createProducts = `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        image VARCHAR(255),
        description TEXT
    )`;

    // Users Table
    const createUsers = `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
    )`;

    // Orders Table
    const createOrders = `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        items JSON NOT NULL,
        total INT NOT NULL,
        payment_method VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    // Seller Applications Table
    const createSellerApps = `CREATE TABLE IF NOT EXISTS seller_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boutique_name VARCHAR(255) NOT NULL,
        trade_license VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    [createProducts, createUsers, createOrders, createSellerApps].forEach(query => {
        connection.query(query, (err) => {
            if (err) console.error('Error creating table:', err.message);
        });
    });

    // Seed products if table is empty
    connection.query("SELECT COUNT(*) as count FROM products", (err, results) => {
        if (err) return;
        if (results[0].count === 0) {
            seedProducts();
        }
    });
}

function seedProducts() {
    const productsPath = path.join(__dirname, 'products.json');
    if (fs.existsSync(productsPath)) {
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        const query = "INSERT INTO products (name, price, image, description) VALUES ?";
        const values = products.map(p => [p.name, p.price, p.image, p.description]);

        connection.query(query, [values], (err) => {
            if (err) console.error('Error seeding products:', err.message);
            else console.log('Database seeded with products from products.json');
        });
    }
}

// API Endpoints

app.get('/api/products', (req, res) => {
    connection.query("SELECT * FROM products", (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    connection.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, password], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: "Registered successfully" });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    connection.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            console.log(`Successful login for: ${email}`);
            res.json({ success: true, message: "Logged in successfully" });
        } else {
            res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    });
});

app.post('/api/orders', (req, res) => {
    const { items, total, payment } = req.body;
    connection.query("INSERT INTO orders (items, total, payment_method) VALUES (?, ?, ?)",
        [JSON.stringify(items), total, payment],
        (err, results) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, orderId: results.insertId });
        }
    );
});

app.post('/api/apply-seller', (req, res) => {
    const { boutiqueName, tradeLicense, description } = req.body;
    if (!boutiqueName || !tradeLicense || !description) {
        return res.status(400).json({ success: false, error: "All fields are required" });
    }
    connection.query("INSERT INTO seller_applications (boutique_name, trade_license, description) VALUES (?, ?, ?)",
        [boutiqueName, tradeLicense, description],
        (err, results) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ success: true, applicationId: results.insertId });
        }
    );
});

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`Backend Server: http://localhost:${PORT}`);
    // Note: To access from other devices, use your LAN IP, e.g., http://192.168.x.x:3000
    console.log(`Network (LAN): http://<Your-IP-Address>:${PORT}`);
    console.log(`Frontend (Node): http://localhost:${PORT}`);
    console.log(`Frontend (XAMPP): http://localhost/fitbazzar/`);
    console.log('='.repeat(50) + '\n');
    console.log('Ready to serve Fit Bazaar!');
});
