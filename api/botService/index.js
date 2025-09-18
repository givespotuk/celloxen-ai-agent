const { BotFrameworkAdapter, TurnContext } = require('botbuilder');
const db = require('../shared/database');
const { getNextQuestion, PHASES } = require('./assessmentLogic');

// Initialize bot adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.BOT_APP_ID,
    appPassword: process.env.BOT_APP_PASSWORD
});

// Store active sessions
const sessions = {};

module.exports = async function (context, req) {
    const { action, sessionId, clinicId, message, patientData, practitionerName } = req.body;
    
    try {
        switch(action) {
            case 'startHolisticAssessment':
                const response = await initializeAssessment(
                    sessionId, 
                    clinicId, 
                    patientData, 
                    practitionerName
                );
                
                context.res = {
                    body: {
                        success: true,
                        sessionId: sessionId,
                        message: response,
                        phase: 'greeting'
                    }
                };
                break;
                
            case 'continueAssessment':
                const result = await processAssessment(
                    sessionId,
                    message,
                    clinicId
                );
                
                context.res = {
                    body: {
                        success: true,
                        message: result.message,
                        phase: result.phase,
                        isComplete: result.isComplete,
                        report: result.report
                    }
                };
                break;
                
            default:
                context.res = {
                    status: 400,
                    body: { success: false, error: 'Invalid action' }
                };
        }
    } catch (error) {
        context.log('Bot Service Error:', error);
        context.res = {
            status: 500,
            body: { success: false, error: error.message }
        };
    }
};

async function initializeAssessment(sessionId, clinicId, patientData, practitionerName) {
    // Initialize session with all patient data
    sessions[sessionId] = {
        clinicId: clinicId,
        practitionerName: practitionerName,
        patientName: patientData.name,
        patientAge: calculateAge(patientData.dob),
        patientGender: patientData.gender,
        patientDOB: patientData.dob,
        phase: PHASES.GREETING,
        symptoms: [],
        severityScores: {},
        responses: [],
        primaryConcern: '',
        duration: '',
        lifestyle: '',
        medicalHistory: ''
    };
    
    // Save to database
    await db.saveSession({
        sessionId: sessionId,
        clinicId: clinicId,
        practitionerName: practitionerName,
        patientName: patientData.name,
        patientDob: patientData.dob,
        patientGender: patientData.gender
    });
    
    // Generate personalized greeting
    const greeting = `Good morning Dr. ${practitionerName}. I'm Cello, your holistic health assessment assistant.
    
I'll be helping you conduct a comprehensive bioelectronic therapy assessment for ${patientData.name}.

Patient Information:
- Name: ${patientData.name}
- Age: ${calculateAge(patientData.dob)} years
- Gender: ${patientData.gender}
- Date of Birth: ${patientData.dob}

Let's begin the assessment. Please confirm you're ready to proceed.`;
    
    return greeting;
}

async function processAssessment(sessionId, message, clinicId) {
    const session = sessions[sessionId];
    if (!session) {
        throw new Error('Session not found. Please restart the assessment.');
    }
    
    // Save user message to database
    await db.saveMessage(sessionId, 'user', message, session.phase);
    session.responses.push(message);
    
    // Get next question using assessment logic
    const response = getNextQuestion(session, message);
    
    // Save assistant response to database
    await db.saveMessage(sessionId, 'assistant', response.message, response.phase);
    
    // If assessment is complete, save the report
    if (response.isComplete && response.report) {
        await saveReport(sessionId, clinicId, session, response.report);
    }
    
    return response;
}

async function saveReport(sessionId, clinicId, session, reportContent) {
    try {
        // Extract therapy code from report (simple parsing)
        const therapyMatch = reportContent.match(/Therapy Code: (\d+)/);
        const therapyCode = therapyMatch ? therapyMatch[1] : '801';
        
        const therapyNameMatch = reportContent.match(/Therapy Name: (.+)/);
        const therapyName = therapyNameMatch ? therapyNameMatch[1].trim() : 'Total Wellness Package';
        
        await db.saveReport({
            sessionId: sessionId,
            clinicId: clinicId,
            reportContent: reportContent,
            symptoms: session.symptoms.join(', '),
            severityScore: session.severityScores.primary || 5,
            therapyCode: therapyCode,
            therapyName: therapyName,
            supplements: 'Personalized recommendations pending'
        });
        
        // Update session status
        await db.query(
            'UPDATE ai_agent_sessions SET status = $1, completed_at = NOW(), recommended_therapy_code = $2, recommended_therapy_name = $3 WHERE session_id = $4',
            ['completed', therapyCode, therapyName, sessionId]
        );
    } catch (error) {
        console.error('Error saving report:', error);
    }
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
