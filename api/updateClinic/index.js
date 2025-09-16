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
                'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }

    try {
        const { clinicId, clinicName, email, ownerName, phone, address, subscriptionStatus, isActive } = req.body;

        if (!clinicId) {
            context.res = {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: 'Clinic ID is required'
                }
            };
            return;
        }

        // Update clinic
        const result = await pool.query(
            `UPDATE clinics 
             SET clinic_name = COALESCE($1, clinic_name),
                 email = COALESCE($2, email),
                 owner_name = COALESCE($3, owner_name),
                 phone = COALESCE($4, phone),
                 address = COALESCE($5, address),
                 subscription_status = COALESCE($6, subscription_status),
                 is_active = COALESCE($7, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [clinicName, email, ownerName, phone, address, subscriptionStatus, isActive, clinicId]
        );

        if (result.rows.length === 0) {
            context.res = {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: 'Clinic not found'
                }
            };
            return;
        }

        // Update user display name if clinic name changed
        if (clinicName) {
            await pool.query(
                'UPDATE users SET display_name = $1 WHERE clinic_id = $2',
                [clinicName, clinicId]
            );
        }

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                message: 'Clinic updated successfully',
                clinic: result.rows[0]
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
                message: 'Failed to update clinic: ' + error.message
            }
        };
    }
};
