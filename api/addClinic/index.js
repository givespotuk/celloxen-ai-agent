const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'celloxen-db.postgres.database.azure.com',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'adminuser',
    password: process.env.DB_PASSWORD || 'Kuwait1000$$',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

module.exports = async function (context, req) {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }

    try {
        const { clinicName, email, ownerName, phone, address, subscriptionStatus, password } = req.body;

        // Check if email already exists
        const existingClinic = await pool.query(
            'SELECT id FROM clinics WHERE email = $1',
            [email]
        );

        if (existingClinic.rows.length > 0) {
            context.res = {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: 'Email already registered'
                }
            };
            return;
        }

        // Insert new clinic
        const clinicResult = await pool.query(
            `INSERT INTO clinics (clinic_name, email, owner_name, phone, address, subscription_status, password_hash, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)
             RETURNING id, clinic_name`,
            [clinicName, email, ownerName, phone, address, subscriptionStatus || 'trial', 'temp_hash']
        );

        const clinic = clinicResult.rows[0];

        // Create user account for clinic
        await pool.query(
            `INSERT INTO users (username, email, password_hash, user_type, role, display_name, clinic_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [email.split('@')[0], email, '$2a$10$YGDdXH0L8K7MlzPwkZpFiOLr0GNtHrNqM.fCpQxX5zKnivgvwRmEi', 'clinic', 'clinic', clinicName, clinic.id]
        );

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                message: 'Clinic added successfully',
                clinicId: clinic.id
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                message: 'Failed to add clinic: ' + error.message
            }
        };
    }
};
