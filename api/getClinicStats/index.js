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
    try {
        const clinicId = req.body?.clinicId || req.query?.clinicId;
        const role = req.body?.role || req.query?.role;

        let stats = {};

        if (role === 'super_admin') {
            // Get total clinics
            const clinicsResult = await pool.query('SELECT COUNT(*) as total FROM clinics');
            stats.totalClinics = clinicsResult.rows[0].total;

            // Get active clinics
            const activeResult = await pool.query('SELECT COUNT(*) as total FROM clinics WHERE is_active = true');
            stats.activeClinics = activeResult.rows[0].total;

            // Get total assessments across all clinics
            const assessmentsResult = await pool.query('SELECT COUNT(*) as total FROM ai_agent_sessions');
            stats.totalAssessments = assessmentsResult.rows[0].total;

            // Get all clinics data
            const clinicsData = await pool.query(`
                SELECT c.*, 
                    (SELECT COUNT(*) FROM ai_agent_sessions WHERE clinic_id = c.id) as assessment_count
                FROM clinics c 
                ORDER BY c.created_at DESC
            `);
            stats.clinics = clinicsData.rows;

        } else if (role === 'clinic' && clinicId) {
            // Get clinic-specific stats
            const patientsResult = await pool.query(
                'SELECT COUNT(DISTINCT patient_name) as total FROM ai_agent_sessions WHERE clinic_id = $1',
                [clinicId]
            );
            stats.totalPatients = patientsResult.rows[0].total;

            // Get assessments for this clinic
            const assessmentsResult = await pool.query(
                'SELECT COUNT(*) as total FROM ai_agent_sessions WHERE clinic_id = $1',
                [clinicId]
            );
            stats.totalAssessments = assessmentsResult.rows[0].total;

            // Get pending reports
            const pendingResult = await pool.query(
                `SELECT COUNT(*) as total FROM ai_agent_sessions 
                 WHERE clinic_id = $1 AND status = 'in_progress'`,
                [clinicId]
            );
            stats.pendingReports = pendingResult.rows[0].total;

            // Get recent assessments
            const recentAssessments = await pool.query(
                `SELECT session_id, patient_name, started_at, status, 
                        recommended_therapy_name as therapy
                 FROM ai_agent_sessions 
                 WHERE clinic_id = $1
                 ORDER BY started_at DESC
                 LIMIT 10`,
                [clinicId]
            );
            stats.recentAssessments = recentAssessments.rows;

            // Get clinic usage
            const clinicInfo = await pool.query(
                'SELECT usage_count, usage_limit FROM clinics WHERE id = $1',
                [clinicId]
            );
            if (clinicInfo.rows.length > 0) {
                stats.usageCount = clinicInfo.rows[0].usage_count || 0;
                stats.usageLimit = clinicInfo.rows[0].usage_limit || 100;
            }
        }

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: stats
        };
    } catch (error) {
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                error: 'Failed to fetch stats',
                message: error.message
            }
        };
    }
};
