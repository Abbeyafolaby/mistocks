import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
user: process.env.POSTGRES_USER,
host: process.env.POSTGRES_HOST,
database: process.env.POSTGRES_DATABASE,
password: process.env.POSTGRES_PASSWORD,
port: process.env.POSTGRES_PORT
});

// Add error handling
db.connect()
.then(() => console.log("✅ Connected to PostgreSQL on port", process.env.POSTGRES_PORT))
.catch(err => {
console.error("❌ Connection failed:", err.message);
process.exit(1); // Exit if connection fails
});

export default db;