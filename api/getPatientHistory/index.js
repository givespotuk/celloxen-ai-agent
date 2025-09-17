const { Pool } = require('pg');

module.exports = async function (context, req) {
    const pool = new Pool({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const { patientId, clinicId } = req.body;
        
        // Get patient details
        const patientResult = await pool.query(
            `SELECT * FROM patients WHERE patient_id = $1 AND clinic_id = $2`,
            [patientId, clinicId]
        );
        
        // Get assessment history
        const assessmentsResult = await pool.query(
            `SELECT session_id, started_at, completed_at, status, 
                    recommended_therapy_name, recommended_therapy_code
             FROM ai_agent_sessions 
             WHERE patient_name = $1 AND clinic_id = $2
             ORDER BY started_at DESC`,
            [patientResult.rows[0]?.full_name || '', clinicId]
        );
        
        context.res = {
            body: { 
                success: true,
                patient: patientResult.rows[0] || {},
                assessments: assessmentsResult.rows || []
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: { success: false, message: error.message }
        };
    } finally {
        await pool.end();
    }
};
