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
    try {
        const { clinicId, searchTerm } = req.body;
        
        if (!clinicId) {
            context.res = {
                status: 400,
                body: { success: false, message: 'Clinic ID required' }
            };
            return;
        }

        // Search for patient
        const query = `
            SELECT id, patient_id, first_name, last_name, full_name, 
                   date_of_birth, phone, email, created_at
            FROM patients 
            WHERE clinic_id = $1 
            AND (LOWER(full_name) LIKE $2 OR 
                 LOWER(patient_id) LIKE $2 OR 
                 phone LIKE $2)
            LIMIT 10
        `;
        
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        const result = await pool.query(query, [clinicId, searchPattern]);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                patients: result.rows,
                found: result.rows.length > 0
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Search failed',
                error: error.message
            }
        };
    }
};
