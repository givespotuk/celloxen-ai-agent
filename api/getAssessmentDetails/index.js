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
        const { sessionId, clinicId } = req.body;
        
        // Get assessment details
        const sessionResult = await pool.query(
            `SELECT s.*, r.report_content, r.supplement_recommendations
             FROM ai_agent_sessions s
             LEFT JOIN ai_agent_reports r ON s.session_id = r.session_id
             WHERE s.session_id = $1 AND s.clinic_id = $2`,
            [sessionId, clinicId]
        );
        
        // Get messages
        const messagesResult = await pool.query(
            `SELECT * FROM ai_agent_messages 
             WHERE session_id = $1 
             ORDER BY timestamp ASC`,
            [sessionId]
        );
        
        context.res = {
            body: { 
                success: true,
                assessment: sessionResult.rows[0] || {},
                messages: messagesResult.rows || []
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
