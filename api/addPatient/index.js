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
    context.log('addPatient called with body:', req.body);
    
    try {
        const { clinicId, firstName, lastName, phone } = req.body;
        
        if (!firstName || !lastName || !phone) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'First name, last name, and phone are required'
                }
            };
            return;
        }
        
        const fullName = `${firstName} ${lastName}`;
        const patientId = 'PAT-' + Date.now().toString().slice(-6);
        
        // Use clinic_id only if it's a valid number greater than 0
        const validClinicId = (clinicId && clinicId > 0) ? clinicId : null;
        
        const query = `
            INSERT INTO patients (
                patient_id, 
                clinic_id, 
                first_name, 
                last_name, 
                full_name, 
                phone, 
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            RETURNING id, patient_id, full_name
        `;
        
        const result = await pool.query(query, [
            patientId,
            validClinicId,  // Will be NULL if invalid
            firstName, 
            lastName, 
            fullName, 
            phone
        ]);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                patient: result.rows[0],
                message: 'Patient registered successfully'
            }
        };
    } catch (error) {
        context.log.error('Error in addPatient:', error);
        context.res = {
            status: 200,  // Return 200 to see error in browser
            body: {
                success: false,
                message: error.message,
                detail: error.detail || 'Database error occurred'
            }
        };
    }
};
