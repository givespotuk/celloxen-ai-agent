const { Pool } = require('pg');

const pool = new Pool({
    host: 'celloxen-db.postgres.database.azure.com',
    database: 'postgres',
    user: 'adminuser',
    password: 'Kuwait1000$$',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

module.exports = async function (context, req) {
    context.log('addPatient called with:', req.body);
    
    try {
        const { clinicId, firstName, lastName, phone } = req.body;
        
        // Simple insert with only required fields
        const query = `
            INSERT INTO patients (clinic_id, first_name, last_name, full_name, phone, created_at) 
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING id, full_name
        `;
        
        const fullName = `${firstName} ${lastName}`;
        const result = await pool.query(query, [clinicId, firstName, lastName, fullName, phone]);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                patient: result.rows[0]
            }
        };
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                message: error.message
            }
        };
    }
};
