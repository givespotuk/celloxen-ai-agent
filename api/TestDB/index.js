const { Pool } = require('pg');

module.exports = async function (context, req) {
    const pool = new Pool({
        host: 'celloxen-db.postgres.database.azure.com',
        database: 'postgres',
        user: 'adminuser',
        password: 'Kuwait1000$$',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        // Test basic connection
        const result = await pool.query('SELECT NOW() as time');
        
        // Try to count rows in our tables
        const sessionCount = await pool.query('SELECT COUNT(*) as count FROM assessment_sessions');
        
        // Try to insert a test record
        const testInsert = await pool.query(`
            INSERT INTO assessment_sessions (session_id, practitioner_name, status) 
            VALUES ($1, $2, $3)
            RETURNING *`,
            ['test-' + Date.now(), 'TestUser', 'test']
        );
        
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                connection: 'Working',
                time: result.rows[0].time,
                existingSessions: sessionCount.rows[0].count,
                testRecordCreated: testInsert.rows[0]
            }
        };
    } catch (error) {
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: false,
                error: error.message,
                code: error.code
            }
        };
    } finally {
        await pool.end();
    }
};
