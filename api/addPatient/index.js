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
        const { clinicId, firstName, lastName, phone, dateOfBirth, gender, email } = req.body;
        
        // Generate patient ID
        const patientId = `P${Date.now()}${Math.floor(Math.random()*1000)}`;
        const fullName = `${firstName} ${lastName}`;
        
        // Insert patient
        const result = await pool.query(
            `INSERT INTO patients (patient_id, clinic_id, patient_name, patient_phone, patient_email, patient_dob, patient_gender, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
             RETURNING *`,
            [patientId, clinicId, fullName, phone, email || null, dateOfBirth || null, gender || null]
        );
        
        context.res = {
            body: { 
                success: true, 
                patient: { 
                    id: result.rows[0].patient_id, 
                    full_name: fullName 
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
