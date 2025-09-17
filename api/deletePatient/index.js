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
        const { clinicId, patientId } = req.body;
        
        if (!clinicId || !patientId) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'Clinic ID and patient ID are required'
                }
            };
            return;
        }

        // Delete patient (cascade will handle related records)
        const query = `
            DELETE FROM patients 
            WHERE id = $1 AND clinic_id = $2
            RETURNING id, full_name
        `;
        
        const result = await pool.query(query, [patientId, clinicId]);
        
        if (result.rows.length === 0) {
            context.res = {
                status: 404,
                body: {
                    success: false,
                    message: 'Patient not found or not authorized'
                }
            };
            return;
        }
        
        context.res = {
            status: 200,
            body: {
                success: true,
                message: 'Patient deleted successfully',
                deletedPatient: result.rows[0]
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Error deleting patient',
                error: error.message
            }
        };
    }
};
