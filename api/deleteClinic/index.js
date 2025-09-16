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
                'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }

    try {
        const { clinicId } = req.body;

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

        // Check if clinic has assessments
        const assessmentCheck = await pool.query(
            'SELECT COUNT(*) as count FROM ai_agent_sessions WHERE clinic_id = $1',
            [clinicId]
        );

        if (assessmentCheck.rows[0].count > 0) {
            // Soft delete - just deactivate
            await pool.query(
                'UPDATE clinics SET is_active = false WHERE id = $1',
                [clinicId]
            );

            await pool.query(
                'UPDATE users SET is_active = false WHERE clinic_id = $1',
                [clinicId]
            );

            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    message: 'Clinic deactivated successfully (has existing assessments)'
                }
            };
        } else {
            // Hard delete - no assessments exist
            await pool.query('DELETE FROM users WHERE clinic_id = $1', [clinicId]);
            await pool.query('DELETE FROM patients WHERE clinic_id = $1', [clinicId]);
            await pool.query('DELETE FROM clinics WHERE id = $1', [clinicId]);

            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    message: 'Clinic deleted successfully'
                }
            };
        }
    } catch (error) {
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                message: 'Failed to delete clinic: ' + error.message
            }
        };
    }
};
