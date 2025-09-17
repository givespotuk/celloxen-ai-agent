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
        const { patientId, clinicId } = req.body;
        
        // Soft delete - mark as inactive
        const result = await pool.query(
            `UPDATE patients 
             SET status = 'inactive', updated_at = NOW()
             WHERE patient_id = $1 AND clinic_id = $2
             RETURNING patient_id`,
            [patientId, clinicId]
        );
        
        context.res = {
            body: { 
                success: true,
                message: 'Patient marked as inactive'
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
