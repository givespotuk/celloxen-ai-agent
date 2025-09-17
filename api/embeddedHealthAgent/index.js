const { v4: uuidv4 } = require('uuid');
const db = require('../shared/database');

// Copy THERAPIES object from original HealthAgent
const THERAPIES = {
  '101': { name: 'Deep Sleep Renewal Therapy', keywords: ['insomnia', 'sleep'], priority: ['sleep'] },
  // ... (same as original)
};

const embeddedSessions = {};

module.exports = async function (context, req) {
    const action = req.body?.action || 'chat';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = (req.body?.message || '').trim();
    const clinicId = req.body?.clinicId;
    const patientId = req.body?.patientId;
    const patientName = req.body?.patientName;
    
    // Initialize session for embedded assessment
    if (!embeddedSessions[sessionId]) {
        embeddedSessions[sessionId] = {
            id: sessionId,
            phase: 'ready_check',  // Skip greeting and patient registration
            clinicId: clinicId,
            patientId: patientId,
            patientName: patientName,
            patientData: { details: patientName },
            symptoms: [],
            assessmentAnswers: [],
            recommendedTherapy: null
        };
        
        // Save session immediately with patient info
        await db.saveSession({
            sessionId: sessionId,
            clinicId: clinicId,
            practitionerName: 'Clinic Staff',
            patientName: patientName
        });
    }
    
    const session = embeddedSessions[sessionId];
    let response = '';
    
    if (action === 'start') {
        response = `Starting assessment for ${patientName}. Ready to begin the health assessment?`;
    } else {
        // Use simplified conversation flow from original
        response = await processEmbeddedConversation(session, message);
    }
    
    // Save messages
    await db.saveMessage(sessionId, 'user', message, session.phase);
    await db.saveMessage(sessionId, 'assistant', response, session.phase);
    
    // Update patient last_assessment_date when complete
    if (session.phase === 'report_complete') {
        await db.query(
            'UPDATE patients SET last_assessment_date = NOW() WHERE patient_id = $1',
            [patientId]
        );
    }
    
    context.res = {
        status: 200,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: {
            success: true,
            sessionId: sessionId,
            message: response,
            phase: session.phase
        }
    };
};

async function processEmbeddedConversation(session, message) {
    // Simplified flow - starts from ready_check since patient is pre-selected
    const lower = message.toLowerCase();
    
    switch(session.phase) {
        case 'ready_check':
            if (lower.includes('yes') || lower.includes('ready')) {
                session.phase = 'contra_pacemaker';
                return "I need to check for safety contraindications. Does the patient have a pacemaker or any implanted electronic device?";
            }
            return "Type 'yes' when ready to begin the assessment.";
            
        // ... (rest of phases same as original but simplified)
    }
}
