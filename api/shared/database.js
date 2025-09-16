const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'celloxen-db.postgres.database.azure.com',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'adminuser',
    password: process.env.DB_PASSWORD || 'Kuwait1000$$',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

module.exports = {
    async saveSession(sessionData) {
        const query = `
            INSERT INTO ai_agent_sessions 
            (session_id, practitioner_name, patient_name, patient_dob, patient_gender, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (session_id) 
            DO UPDATE SET 
                patient_name = EXCLUDED.patient_name,
                patient_dob = EXCLUDED.patient_dob,
                patient_gender = EXCLUDED.patient_gender
            RETURNING *`;
        
        const values = [
            sessionData.sessionId,
            sessionData.practitionerName,
            sessionData.patientName || null,
            sessionData.patientDob || null,
            sessionData.patientGender || null,
            'in_progress'
        ];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Database error:', error);
            return null;
        }
    },

    async saveMessage(sessionId, messageType, messageText, phase) {
        const query = `
            INSERT INTO ai_agent_messages 
            (session_id, message_type, message_text, phase)
            VALUES ($1, $2, $3, $4)
            RETURNING *`;
        
        try {
            const result = await pool.query(query, [sessionId, messageType, messageText, phase]);
            return result.rows[0];
        } catch (error) {
            console.error('Error saving message:', error);
            return null;
        }
    },

    async saveReport(reportData) {
        const query = `
            INSERT INTO ai_agent_reports 
            (session_id, report_content, symptoms, severity_score, therapy_code, therapy_name, supplement_recommendations)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING report_id`;
        
        try {
            const result = await pool.query(query, [
                reportData.sessionId,
                reportData.reportContent,
                reportData.symptoms,
                reportData.severityScore || 0,
                reportData.therapyCode,
                reportData.therapyName,
                reportData.supplements
            ]);
            
            await pool.query(
                `UPDATE ai_agent_sessions 
                 SET status = 'completed', 
                     completed_at = CURRENT_TIMESTAMP,
                     recommended_therapy_code = $1,
                     recommended_therapy_name = $2
                 WHERE session_id = $3`,
                [reportData.therapyCode, reportData.therapyName, reportData.sessionId]
            );
            
            return result.rows[0].report_id;
        } catch (error) {
            console.error('Error saving report:', error);
            return null;
        }
    },

    async getReport(reportId) {
        const query = `
            SELECT r.*, s.practitioner_name, s.patient_name, s.patient_dob, s.patient_gender
            FROM ai_agent_reports r
            JOIN ai_agent_sessions s ON r.session_id = s.session_id
            WHERE r.report_id = $1`;
        
        try {
            const result = await pool.query(query, [reportId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching report:', error);
            return null;
        }
    },

    async getSessionHistory(practitionerName) {
        const query = `
            SELECT * FROM ai_agent_sessions 
            WHERE practitioner_name = $1 
            ORDER BY started_at DESC 
            LIMIT 50`;
        
        try {
            const result = await pool.query(query, [practitionerName]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    },

    // NEW FUNCTION: Get supplements for a therapy code
    async getSupplementsForTherapy(therapyCode) {
        const query = `
            SELECT supplement_name, dosage, duration, benefits 
            FROM ai_agent_supplements 
            WHERE therapy_codes LIKE $1
            ORDER BY supplement_name`;
        
        try {
            const result = await pool.query(query, [`%${therapyCode}%`]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching supplements:', error);
            return [];
        }
    },

    // NEW FUNCTION: Get all supplements
    async getAllSupplements() {
        const query = `
            SELECT * FROM ai_agent_supplements 
            ORDER BY supplement_name`;
        
        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching all supplements:', error);
            return [];
        }
    }
};
