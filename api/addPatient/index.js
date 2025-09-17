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
        const { clinicId, firstName, lastName, dateOfBirth, gender, email, phone, nhsNumber, postcode } = req.body;
        
        const patientId = 'PAT-' + Date.now().toString().slice(-6);
        const fullName = `${firstName} ${lastName}`;
        
        const query = `
            INSERT INTO patients (
                clinic_id, patient_id, first_name, last_name, full_name,
                date_of_birth, gender, email, phone, nhs_number, postcode, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
            RETURNING id, patient_id, full_name
        `;
        
        const values = [clinicId, patientId, firstName, lastName, fullName, 
                       dateOfBirth, gender, email, phone, nhsNumber, postcode];
        
        const result = await pool.query(query, values);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                patient: result.rows[0]
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Failed to register patient',
                error: error.message
            }
        };
    }
};
