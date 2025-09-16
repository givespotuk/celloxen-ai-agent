const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    host: process.env.DB_HOST || 'celloxen-db.postgres.database.azure.com',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'adminuser',
    password: process.env.DB_PASSWORD || 'Kuwait1000$$',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

module.exports = async function (context, req) {
    context.log('Get reports API called');

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        context.res = {
            status: 401,
            body: { success: false, message: 'No valid authentication token' }
        };
        return;
    }

    try {
        // Verify admin role
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'celloxen-secret-key-2024');
        
        if (decoded.role !== 'super_admin') {
            context.res = {
                status: 403,
                body: { success: false, message: 'Admin access required' }
            };
            return;
        }

        const { reportType, dateFrom, dateTo, clinicId } = req.body;

        // Get therapy distribution
        const therapyQuery = `
            SELECT 
                recommended_therapy_name as therapy,
                recommended_therapy_code as code,
                COUNT(*) as count
            FROM ai_agent_sessions
            WHERE status = 'completed'
                AND recommended_therapy_name IS NOT NULL
                ${dateFrom ? "AND started_at >= $1" : ""}
                ${dateTo ? "AND started_at <= $2" : ""}
                ${clinicId ? "AND clinic_id = $3" : ""}
            GROUP BY recommended_therapy_name, recommended_therapy_code
            ORDER BY count DESC
        `;

        // Get monthly trends
        const trendsQuery = `
            SELECT 
                DATE_TRUNC('month', started_at) as month,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(DISTINCT clinic_id) as active_clinics
            FROM ai_agent_sessions
            WHERE started_at >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY month
            ORDER BY month DESC
        `;

        // Get clinic performance
        const clinicPerfQuery = `
            SELECT 
                c.clinic_name,
                c.id,
                COUNT(s.session_id) as total_assessments,
                COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed,
                c.usage_count,
                c.usage_limit,
                ROUND((c.usage_count::numeric / NULLIF(c.usage_limit, 0)) * 100, 2) as usage_percentage
            FROM clinics c
            LEFT JOIN ai_agent_sessions s ON c.id = s.clinic_id
            WHERE c.is_active = true
            GROUP BY c.id, c.clinic_name, c.usage_count, c.usage_limit
            ORDER BY total_assessments DESC
        `;

        // Get symptom analysis
        const symptomQuery = `
            SELECT 
                symptoms,
                COUNT(*) as frequency
            FROM ai_agent_reports
            WHERE symptoms IS NOT NULL
                ${dateFrom ? "AND created_at >= $1" : ""}
                ${dateTo ? "AND created_at <= $2" : ""}
            GROUP BY symptoms
            ORDER BY frequency DESC
            LIMIT 20
        `;

        // Execute queries
        const params = [];
        if (dateFrom) params.push(dateFrom);
        if (dateTo) params.push(dateTo);
        if (clinicId) params.push(clinicId);

        const [therapyResult, trendsResult, clinicPerfResult, symptomResult] = await Promise.all([
            pool.query(therapyQuery, params),
            pool.query(trendsQuery),
            pool.query(clinicPerfQuery),
            pool.query(symptomQuery, params.slice(0, 2))
        ]);

        // Get summary statistics
        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT s.session_id) as total_assessments,
                COUNT(DISTINCT s.clinic_id) as total_clinics,
                COUNT(DISTINCT s.patient_name) as total_patients,
                AVG(r.severity_score) as avg_severity,
                COUNT(CASE WHEN s.status = 'completed' THEN 1 END) * 100.0 / 
                    NULLIF(COUNT(*), 0) as completion_rate
            FROM ai_agent_sessions s
            LEFT JOIN ai_agent_reports r ON s.session_id = r.session_id
            WHERE s.started_at >= CURRENT_DATE - INTERVAL '30 days'
        `;
        
        const summaryResult = await pool.query(summaryQuery);

        context.res = {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                summary: summaryResult.rows[0],
                therapyDistribution: therapyResult.rows,
                monthlyTrends: trendsResult.rows,
                clinicPerformance: clinicPerfResult.rows,
                topSymptoms: symptomResult.rows.slice(0, 10),
                exportData: {
                    therapies: therapyResult.rows,
                    trends: trendsResult.rows,
                    clinics: clinicPerfResult.rows
                }
            }
        };
        
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: { 
                success: false, 
                message: 'Failed to generate reports',
                error: error.message 
            }
        };
    }
};
