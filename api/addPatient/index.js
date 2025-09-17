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
        const { clinicId, patientData } = req.body;
        
        if (!clinicId || !patientData) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'Clinic ID and patient data are required'
                }
            };
            return;
        }

        // Generate patient ID
        const patientId = 'PAT-' + Date.now().toString().slice(-6);
        
        const query = `
            INSERT INTO patients (
                clinic_id, patient_id, first_name, last_name, full_name,
                date_of_birth, gender, email, phone, address,
                nhs_number, postcode, emergency_contact_name,
                emergency_contact_phone, emergency_contact_relationship,
                medical_history, gdpr_consent, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP
            ) RETURNING *
        `;
        
        const values = [
            clinicId,
            patientId,
            patientData.firstName,
            patientData.lastName,
            `${patientData.firstName} ${patientData.lastName}`,
            patientData.dateOfBirth,
            patientData.gender,
            patientData.email,
            patientData.phone,
            patientData.address,
            patientData.nhsNumber,
            patientData.postcode,
            patientData.emergencyContactName,
            patientData.emergencyContactPhone,
            patientData.emergencyContactRelationship,
            patientData.medicalHistory,
            patientData.gdprConsent || true
        ];
        
        const result = await pool.query(query, values);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                message: 'Patient added successfully',
                patient: result.rows[0]
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Error adding patient',
                error: error.message
            }
        };
    }
};
