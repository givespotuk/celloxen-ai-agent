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
        
        // Count patients with last assessment date
        const patientsResult = await pool.query(
            `SELECT 
                COUNT(*) as count,
                COUNT(last_assessment_date) as assessed_count,
                MAX(last_assessment_date) as last_assessment
             FROM patients 
             WHERE clinic_id = $1 AND (status IS NULL OR status = 'active')`,
            [clinicId]
        );
        
        // Count assessments
        const assessmentsResult = await pool.query(
            'SELECT COUNT(*) as count FROM ai_agent_sessions WHERE clinic_id = $1',
            [clinicId]
        );
        
        // Count pending reports
        const pendingResult = await pool.query(
            'SELECT COUNT(*) as count FROM ai_agent_sessions WHERE clinic_id = $1 AND status = $2',
            [clinicId, 'in_progress']
        );
        
        // Get recent assessments with patient last visit info
        const recentAssessments = await pool.query(
            `SELECT 
                s.session_id, 
                s.patient_name, 
                s.status, 
                s.started_at,
                s.recommended_therapy_name as therapy,
                p.last_assessment_date
             FROM ai_agent_sessions s
             LEFT JOIN patients p ON p.full_name = s.patient_name AND p.clinic_id = s.clinic_id
             WHERE s.clinic_id = $1 
             ORDER BY s.started_at DESC 
             LIMIT 10`,
            [clinicId]
        );
        
        context.res = {
            body: {
                totalPatients: parseInt(patientsResult.rows[0].count) || 0,
                assessedPatients: parseInt(patientsResult.rows[0].assessed_count) || 0,
                lastPatientAssessment: patientsResult.rows[0].last_assessment,
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
                assessedPatients: 0,
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
