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
        
        // Ensure clinicId is an integer
        const clinicIdInt = parseInt(clinicId) || 2;
        
        context.log(`Deleting patient: ${patientId} from clinic: ${clinicIdInt}`);
        
        const result = await pool.query(
            `UPDATE patients 
             SET status = 'inactive', updated_at = NOW()
             WHERE patient_id = $1 AND clinic_id = $2
             RETURNING patient_id, status`,
            [patientId, clinicIdInt]
        );
        
        if (result.rows.length > 0) {
            context.res = {
                body: { 
                    success: true,
                    message: 'Patient marked as inactive',
                    deleted: result.rows[0]
                }
            };
        } else {
            context.res = {
                status: 404,
                body: { 
                    success: false,
                    message: 'Patient not found'
                }
            };
        }
    } catch (error) {
        context.log(`Delete error: ${error.message}`);
        context.res = {
            status: 500,
            body: { success: false, message: error.message }
        };
    } finally {
        await pool.end();
    }
};
