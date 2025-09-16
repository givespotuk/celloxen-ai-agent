// Database connection module
const { Pool } = require('pg');

let pool = null;

function getPool() {
    if (!pool) {
        pool = new Pool({
            host: process.env.DB_HOST || 'celloxen-db.postgres.database.azure.com',
            database: process.env.DB_NAME || 'postgres',
            user: process.env.DB_USER || 'adminuser',
            password: process.env.DB_PASSWORD || 'Kuwait1000$$',
            port: 5432,
            ssl: { rejectUnauthorized: false }
        });
    }
    return pool;
}

module.exports = {
    query: async (text, params) => {
        const client = getPool();
        try {
            return await client.query(text, params);
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
};
