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
        const { clinicId } = req.body;
        
        const result = await pool.query(
            `SELECT patient_id, full_name, first_name, last_name, phone, 
                    date_of_birth, gender, created_at 
             FROM patients 
             WHERE clinic_id = $1 
             ORDER BY created_at DESC`,
            [clinicId]
        );
        
        context.res = {
            body: { 
                success: true, 
                patients: result.rows 
            }
        };
    } catch (error) {
        context.log('Error fetching patients:', error);
        context.res = {
            status: 500,
            body: { 
                success: false, 
                patients: [],
                message: error.message 
            }
        };
    } finally {
        await pool.end();
    }
};
