const { BotFrameworkAdapter, TurnContext } = require('botbuilder');
const db = require('../shared/database');

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
                        phase: 'initial_greeting'
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
    // Initialize session
    sessions[sessionId] = {
        clinicId: clinicId,
        practitionerName: practitionerName,
        patientName: patientData.name,
        patientAge: calculateAge(patientData.dob),
        patientGender: patientData.gender,
        patientDOB: patientData.dob,
        phase: 'greeting',
        symptoms: [],
        severityScores: {},
        responses: []
    };
    
    // Save to database
    await db.saveSession({
        sessionId: sessionId,
        clinicId: clinicId,
        practitionerName: practitionerName,
        patientName: patientData.name
    });
    
    // Generate personalized greeting
    const greeting = `Good morning Dr. ${practitionerName}. I'm Cello, your holistic health assessment assistant.
    
I'll be helping you conduct a comprehensive bioelectronic therapy assessment for ${patientData.name}.

Patient Information:
- Name: ${patientData.name}
- Age: ${calculateAge(patientData.dob)} years
- Gender: ${patientData.gender}
- Date of Birth: ${patientData.dob}

Let's begin the assessment. Please ask ${patientData.name} to describe their primary health concern in their own words.`;
    
    return greeting;
}

async function processAssessment(sessionId, message, clinicId) {
    const session = sessions[sessionId];
    if (!session) {
        throw new Error('Session not found');
    }
    
    // Save user message
    await db.saveMessage(sessionId, 'user', message, session.phase);
    session.responses.push(message);
    
    // Process based on current phase
    let response = await getNextQuestion(session, message);
    
    // Save assistant response
    await db.saveMessage(sessionId, 'assistant', response.message, response.phase);
    
    return response;
}

async function getNextQuestion(session, userResponse) {
    // This will contain the assessment logic
    // We'll expand this in the next step
    return {
        message: "Processing your response...",
        phase: session.phase,
        isComplete: false
    };
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
