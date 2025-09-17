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
        const { clinicId, role } = req.body;
        
        // Get clinic details
        const clinicResult = await pool.query(
            'SELECT * FROM clinics WHERE id = $1',
            [clinicId]
        );
        
        const clinic = clinicResult.rows[0] || {};
        
        // Count active patients
        const patientsResult = await pool.query(
            `SELECT COUNT(*) as count FROM patients 
             WHERE clinic_id = $1 AND (status = 'active' OR status IS NULL)`,
            [clinicId]
        );
        
        // Count all assessments (keep showing historical data)
        const assessmentsResult = await pool.query(
            'SELECT COUNT(*) as count FROM ai_agent_sessions WHERE clinic_id = $1',
            [clinicId]
        );
        
        // Count pending reports
        const pendingResult = await pool.query(
            `SELECT COUNT(*) as count FROM ai_agent_sessions 
             WHERE clinic_id = $1 AND status = 'in_progress'`,
            [clinicId]
        );
        
        // Get recent assessments
        const recentAssessments = await pool.query(
            `SELECT session_id, patient_name, status, started_at, 
                    recommended_therapy_name as therapy
             FROM ai_agent_sessions 
             WHERE clinic_id = $1 
             ORDER BY started_at DESC 
             LIMIT 10`,
            [clinicId]
        );
        
        context.res = {
            body: {
                totalPatients: parseInt(patientsResult.rows[0].count) || 0,
                totalAssessments: parseInt(assessmentsResult.rows[0].count) || 0,
                pendingReports: parseInt(pendingResult.rows[0].count) || 0,
                usageCount: clinic.usage_count || 0,
                usageLimit: clinic.usage_limit || 100,
                recentAssessments: recentAssessments.rows || []
            }
        };
        
    } catch (error) {
        context.log('Stats error:', error);
        context.res = {
            status: 500,
            body: {
                totalPatients: 0,
                totalAssessments: 0,
                pendingReports: 0,
                usageCount: 0,
                usageLimit: 100,
                recentAssessments: [],
                error: error.message
            }
        };
    } finally {
        await pool.end();
    }
};
