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
        const { clinicId, searchTerm } = req.body;
        
        const result = await pool.query(
            `SELECT patient_id, full_name, first_name, last_name, phone, email, 
                    date_of_birth, gender, nhs_number, postcode 
             FROM patients 
             WHERE clinic_id = $1 
             AND (full_name ILIKE $2 OR patient_id ILIKE $2 OR phone ILIKE $2 
                  OR first_name ILIKE $2 OR last_name ILIKE $2)
             ORDER BY created_at DESC
             LIMIT 10`,
            [clinicId, `%${searchTerm}%`]
        );
        
        context.res = {
            body: { 
                success: true, 
                patients: result.rows 
            }
        };
    } catch (error) {
        context.log('Search error:', error);
        context.res = {
            status: 500,
            body: { 
                success: false, 
                message: error.message,
                patients: [] 
            }
        };
    } finally {
        await pool.end();
    }
};
