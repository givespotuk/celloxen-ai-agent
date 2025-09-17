const { Pool } = require('pg');

const pool = new Pool({
    host: 'celloxen-db.postgres.database.azure.com',
    database: 'postgres',
    user: 'adminuser',
    password: 'Kuwait1000$$',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = async function (context, req) {
    try {
        const query = 'SELECT setting_key, setting_value, setting_type, description FROM system_settings ORDER BY setting_key';
        const result = await pool.query(query);
        
        // Convert to key-value object for easier frontend use
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = {
                value: row.setting_value,
                type: row.setting_type,
                description: row.description
            };
        });
        
        context.res = {
            status: 200,
            body: {
                success: true,
                settings: settings
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Error fetching settings',
                error: error.message
            }
        };
    }
};
