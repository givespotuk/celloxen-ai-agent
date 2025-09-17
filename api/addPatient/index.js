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
        const { clinicId, firstName, lastName, phone, dateOfBirth, gender, email, nhsNumber, postcode } = req.body;
        
        // Generate patient ID
        const patientId = `P${Date.now()}${Math.floor(Math.random()*1000)}`;
        
        // Insert patient
        const result = await pool.query(
            `INSERT INTO patients (patient_id, clinic_id, first_name, last_name, full_name, phone, email, date_of_birth, gender, nhs_number, postcode, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
             RETURNING *`,
            [patientId, clinicId, firstName, lastName, `${firstName} ${lastName}`, phone, email || null, dateOfBirth || null, gender || null, nhsNumber || null, postcode || null]
        );
        
        context.res = {
            body: { 
                success: true, 
                patient: { 
                    id: result.rows[0].patient_id, 
                    full_name: result.rows[0].full_name 
                }
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
