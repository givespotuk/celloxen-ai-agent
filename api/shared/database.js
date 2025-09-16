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
            (session_id, clinic_id, practitioner_name, patient_name, patient_dob, patient_gender, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (session_id) 
            DO UPDATE SET 
                clinic_id = EXCLUDED.clinic_id,
                patient_name = EXCLUDED.patient_name,
                patient_dob = EXCLUDED.patient_dob,
                patient_gender = EXCLUDED.patient_gender
            RETURNING *`;
        
        const values = [
            sessionData.sessionId,
            sessionData.clinicId || null,  // Add clinic ID
            sessionData.practitionerName || sessionData.clinicName || 'Clinic',
            sessionData.patientName || null,
            sessionData.patientDob || null,
            sessionData.patientGender || null,
            'in_progress'
        ];
        
        try {
            const result = await pool.query(query, values);
            
            // Increment clinic usage if clinic ID provided
            if (sessionData.clinicId) {
                await pool.query(
                    'UPDATE clinics SET usage_count = usage_count + 1 WHERE id = $1',
                    [sessionData.clinicId]
                );
            }
            
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
            (session_id, clinic_id, report_content, symptoms, severity_score, therapy_code, therapy_name, supplement_recommendations)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING report_id`;
        
        try {
            // Get clinic_id from session
            let clinicId = reportData.clinicId;
            if (!clinicId) {
                const sessionResult = await pool.query(
                    'SELECT clinic_id FROM ai_agent_sessions WHERE session_id = $1',
                    [reportData.sessionId]
                );
                clinicId = sessionResult.rows[0]?.clinic_id || null;
            }
            
            const result = await pool.query(query, [
                reportData.sessionId,
                clinicId,
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
            SELECT r.*, s.practitioner_name, s.patient_name, s.patient_dob, s.patient_gender, s.clinic_id
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

    async getSessionHistory(clinicId) {
        const query = `
            SELECT * FROM ai_agent_sessions 
            WHERE clinic_id = $1 
            ORDER BY started_at DESC 
            LIMIT 50`;
        
        try {
            const result = await pool.query(query, [clinicId]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    },

    async getSessionByPractitioner(practitionerName) {
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

    // Check clinic usage limits
    async checkClinicUsage(clinicId) {
        if (!clinicId) return { allowed: true };
        
        const query = `
            SELECT usage_count, usage_limit, is_active 
            FROM clinics 
            WHERE id = $1`;
        
        try {
            const result = await pool.query(query, [clinicId]);
            if (result.rows.length === 0) {
                return { allowed: false, message: 'Clinic not found' };
            }
            
            const clinic = result.rows[0];
            if (!clinic.is_active) {
                return { allowed: false, message: 'Clinic is inactive' };
            }
            
            if (clinic.usage_count >= clinic.usage_limit) {
                return { allowed: false, message: 'Monthly usage limit reached' };
            }
            
            return { 
                allowed: true, 
                remaining: clinic.usage_limit - clinic.usage_count 
            };
        } catch (error) {
            console.error('Error checking clinic usage:', error);
            return { allowed: true }; // Allow by default if check fails
        }
    },

    // Get supplements for a therapy code
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

    // Get all supplements
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
    },

    // Save patient to clinic
    async savePatient(clinicId, patientData) {
        const query = `
            INSERT INTO patients (clinic_id, patient_name, patient_dob, patient_gender, patient_email, patient_phone)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (clinic_id, patient_name, patient_dob) 
            DO UPDATE SET 
                patient_email = EXCLUDED.patient_email,
                patient_phone = EXCLUDED.patient_phone,
                updated_at = CURRENT_TIMESTAMP
            RETURNING patient_id`;
        
        try {
            const result = await pool.query(query, [
                clinicId,
                patientData.name,
                patientData.dob || null,
                patientData.gender || null,
                patientData.email || null,
                patientData.phone || null
            ]);
            return result.rows[0].patient_id;
        } catch (error) {
            console.error('Error saving patient:', error);
            return null;
        }
    }
};
