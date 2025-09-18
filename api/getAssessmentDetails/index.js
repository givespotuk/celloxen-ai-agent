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
        const { sessionId, clinicId } = req.body;
        
        // Get assessment details from ai_agent_sessions only
        const result = await pool.query(
            `SELECT * FROM ai_agent_sessions 
             WHERE session_id = $1 AND clinic_id = $2`,
            [sessionId, clinicId]
        );
        
        if (result.rows.length > 0) {
            const assessment = result.rows[0];
            
            // Create a basic report if none exists
            const reportContent = `
CELLOXEN ASSESSMENT REPORT
===========================
Session ID: ${assessment.session_id}
Patient: ${assessment.patient_name}
Date: ${new Date(assessment.started_at).toLocaleDateString('en-GB')}
Status: ${assessment.status}

THERAPY RECOMMENDATION
----------------------
Code: ${assessment.recommended_therapy_code || 'N/A'}
Name: ${assessment.recommended_therapy_name || 'Pending'}

PATIENT INFORMATION
-------------------
DOB: ${assessment.patient_dob || 'N/A'}
Gender: ${assessment.patient_gender || 'N/A'}

ASSESSMENT DETAILS
------------------
Started: ${new Date(assessment.started_at).toLocaleString('en-GB')}
Completed: ${assessment.completed_at ? new Date(assessment.completed_at).toLocaleString('en-GB') : 'In Progress'}
Practitioner: ${assessment.practitioner_name}
===========================`;
            
            context.res = {
                body: { 
                    success: true,
                    assessment: {
                        ...assessment,
                        report_content: reportContent
                    }
                }
            };
        } else {
            context.res = {
                status: 404,
                body: { 
                    success: false,
                    message: 'Assessment not found'
                }
            };
        }
    } catch (error) {
        context.log('Error:', error);
        context.res = {
            status: 500,
            body: { 
                success: false, 
                message: error.message 
            }
        };
    } finally {
        await pool.end();
    }
};
