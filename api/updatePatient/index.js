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
        const { clinicId, patientId, patientData } = req.body;
        
        if (!clinicId || !patientId || !patientData) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'Clinic ID, patient ID and data are required'
                }
            };
            return;
        }

        const query = `
            UPDATE patients SET
                first_name = $1,
                last_name = $2,
                full_name = $3,
                date_of_birth = $4,
                gender = $5,
                email = $6,
                phone = $7,
                address = $8,
                nhs_number = $9,
                postcode = $10,
                emergency_contact_name = $11,
                emergency_contact_phone = $12,
                emergency_contact_relationship = $13,
                medical_history = $14,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 AND clinic_id = $16
            RETURNING *
        `;
        
        const values = [
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
            patientId,
            clinicId
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            context.res = {
                status: 404,
                body: {
                    success: false,
                    message: 'Patient not found'
                }
            };
            return;
        }
        
        context.res = {
            status: 200,
            body: {
                success: true,
                message: 'Patient updated successfully',
                patient: result.rows[0]
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Error updating patient',
                error: error.message
            }
        };
    }
};
