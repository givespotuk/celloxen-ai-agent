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
        const { patientId, clinicId, updates } = req.body;
        
        const fields = [];
        const values = [];
        let index = 1;
        
        Object.keys(updates).forEach(key => {
            fields.push(`${key} = $${index}`);
            values.push(updates[key]);
            index++;
        });
        
        values.push(patientId, clinicId);
        
        const result = await pool.query(
            `UPDATE patients 
             SET ${fields.join(', ')}, updated_at = NOW()
             WHERE patient_id = $${index} AND clinic_id = $${index + 1}
             RETURNING *`,
            values
        );
        
        context.res = {
            body: { 
                success: true,
                patient: result.rows[0]
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
