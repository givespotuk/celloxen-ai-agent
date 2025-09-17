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
        const { patientId, clinicId, medicalHistory } = req.body;
        
        const result = await pool.query(
            `UPDATE patients 
             SET medical_history = $1, updated_at = NOW()
             WHERE patient_id = $2 AND clinic_id = $3
             RETURNING patient_id, medical_history`,
            [medicalHistory, patientId, clinicId]
        );
        
        context.res = {
            body: { 
                success: true,
                updated: result.rows[0]
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
