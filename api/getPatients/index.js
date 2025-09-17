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
        const { clinicId } = req.body;
        
        if (!clinicId) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'Clinic ID is required'
                }
            };
            return;
        }
        
        const query = `
            SELECT 
                id,
                patient_id,
                first_name,
                last_name,
                full_name,
                date_of_birth,
                gender,
                email,
                phone,
                nhs_number,
                created_at
            FROM patients 
            WHERE clinic_id = $1 
            ORDER BY created_at DESC
        `;
        
        const result = await pool.query(query, [clinicId]);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                patients: result.rows
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Error fetching patients',
                error: error.message
            }
        };
    }
};
