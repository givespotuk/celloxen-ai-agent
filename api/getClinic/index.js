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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }

    try {
        const clinicId = req.body?.clinicId || req.query?.clinicId;

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

        // Get clinic details
        const clinicResult = await pool.query(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM ai_agent_sessions WHERE clinic_id = c.id) as total_assessments,
                    (SELECT COUNT(DISTINCT patient_name) FROM ai_agent_sessions WHERE clinic_id = c.id) as total_patients,
                    (SELECT COUNT(*) FROM ai_agent_sessions WHERE clinic_id = c.id AND status = 'completed') as completed_assessments,
                    (SELECT COUNT(*) FROM ai_agent_sessions WHERE clinic_id = c.id AND status = 'in_progress') as pending_assessments
             FROM clinics c
             WHERE c.id = $1`,
            [clinicId]
        );

        if (clinicResult.rows.length === 0) {
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

        // Get recent assessments
        const recentAssessments = await pool.query(
            `SELECT session_id, patient_name, started_at, status, recommended_therapy_name
             FROM ai_agent_sessions
             WHERE clinic_id = $1
             ORDER BY started_at DESC
             LIMIT 5`,
            [clinicId]
        );

        const clinic = clinicResult.rows[0];
        clinic.recent_assessments = recentAssessments.rows;

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                clinic: clinic
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
                message: 'Failed to get clinic details: ' + error.message
            }
        };
    }
};
