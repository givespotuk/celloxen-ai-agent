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
        
        // Delete assessment and related data
        await pool.query('BEGIN');
        
        // Delete messages
        await pool.query(
            'DELETE FROM ai_agent_messages WHERE session_id = $1',
            [sessionId]
        );
        
        // Delete reports if exists
        await pool.query(
            'DELETE FROM ai_agent_reports WHERE session_id = $1',
            [sessionId]
        );
        
        // Delete session
        const result = await pool.query(
            'DELETE FROM ai_agent_sessions WHERE session_id = $1 AND clinic_id = $2 RETURNING session_id',
            [sessionId, clinicId]
        );
        
        await pool.query('COMMIT');
        
        context.res = {
            body: { 
                success: true,
                message: 'Assessment deleted successfully',
                deleted: result.rows[0]
            }
        };
    } catch (error) {
        await pool.query('ROLLBACK');
        context.res = {
            status: 500,
            body: { success: false, message: error.message }
        };
    } finally {
        await pool.end();
    }
};
