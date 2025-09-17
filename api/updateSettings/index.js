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
        const { settings, updatedBy } = req.body;
        
        if (!settings || typeof settings !== 'object') {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'Invalid settings data'
                }
            };
            return;
        }
        
        // Update each setting
        const updatePromises = Object.keys(settings).map(key => {
            return pool.query(
                'UPDATE system_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE setting_key = $3',
                [settings[key], updatedBy || 'admin', key]
            );
        });
        
        await Promise.all(updatePromises);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                message: 'Settings updated successfully'
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Error updating settings',
                error: error.message
            }
        };
    }
};
