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
    context.log('Get all assessments API called');

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

        // Get filter parameters
        const { clinicId, status, dateFrom, dateTo } = req.body;
        
        // Build query with filters
        let query = `
            SELECT 
                s.session_id,
                s.patient_name,
                s.practitioner_name,
                s.status,
                s.started_at,
                s.completed_at,
                s.recommended_therapy_name,
                s.recommended_therapy_code,
                s.clinic_id,
                c.clinic_name,
                c.email as clinic_email
            FROM ai_agent_sessions s
            LEFT JOIN clinics c ON s.clinic_id = c.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;

        // Add filters
        if (clinicId) {
            params.push(clinicId);
            query += ` AND s.clinic_id = $${++paramCount}`;
        }
        
        if (status) {
            params.push(status);
            query += ` AND s.status = $${++paramCount}`;
        }
        
        if (dateFrom) {
            params.push(dateFrom);
            query += ` AND s.started_at >= $${++paramCount}`;
        }
        
        if (dateTo) {
            params.push(dateTo);
            query += ` AND s.started_at <= $${++paramCount}`;
        }
        
        query += ' ORDER BY s.started_at DESC LIMIT 100';
        
        const result = await pool.query(query, params);
        
        // Get summary statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(DISTINCT clinic_id) as unique_clinics
            FROM ai_agent_sessions
            WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
        `;
        
        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];
        
        context.res = {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                assessments: result.rows,
                stats: {
                    total: parseInt(stats.total),
                    completed: parseInt(stats.completed),
                    inProgress: parseInt(stats.in_progress),
                    uniqueClinics: parseInt(stats.unique_clinics)
                }
            }
        };
        
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: { 
                success: false, 
                message: 'Failed to retrieve assessments',
                error: error.message 
            }
        };
    }
};
