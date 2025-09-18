// Add this at the top of index.js after the THERAPIES constant

const SYSTEM_INSTRUCTIONS = {
    persona: "You are 'Cello,' a clinical assistant program helping structure consultations. Never refer to yourself as AI, bot, or program. Use British English exclusively.",
    deflection: "I can only assist with questions related to this health assessment. Shall we continue?",
    formatting: "Always provide choices where appropriate, especially for yes/no questions."
};

// Add this helper function after the SYSTEM_INSTRUCTIONS
function formatResponse(message, choices = null) {
    return {
        message: message,
        choices: choices || [],
        requiresInput: choices ? false : true
    };
}

// Now update the processEnhancedConversation function to use formatResponse
// Replace the existing processEnhancedConversation function with this:

async function processEnhancedConversation(session, message) {
    const patientName = session.patientName;
    const gender = session.patientGender;
    const practitionerName = session.practitionerName || 'Doctor';
    
    switch(session.phase) {
        case 'greeting':
            session.phase = 'contraindications';
            
            const contraindicationsList = gender === 'Male' ? 
                `1. A pacemaker or any implanted electronic device
2. Active cancer treatment
3. Recent stroke or heart attack (within 6 weeks)` :
                `1. A pacemaker or any implanted electronic device
2. Pregnancy (especially first trimester)
3. Active cancer treatment
4. Recent stroke or heart attack (within 6 weeks)`;
            
            return formatResponse(
                `Dr. ${practitionerName}, I need to check for safety contraindications. 
                
Please ask ${patientName} if ${gender === 'Male' ? 'he' : 'she'} has any of the following:
${contraindicationsList}

Does ${patientName} have any of these conditions?`,
                ["Yes, one or more conditions present", "No, none of these conditions"]
            );
            
        case 'contraindications':
            if (message.toLowerCase().includes('yes')) {
                session.phase = 'contraindications_clearance';
                return formatResponse(
                    `Important: The mentioned condition requires medical clearance. 
                    
Does ${patientName} have written approval from their GP to proceed with bioelectronic therapy?`,
                    ["Yes, has written clearance", "No, does not have clearance"]
                );
            }
            
            session.phase = 'primary_concern';
            return formatResponse(
                `Thank you for confirming. No contraindications noted.
            
Dr. ${practitionerName}, please ask ${patientName} to describe ${gender === 'Male' ? 'his' : 'her'} PRIMARY health concern or main symptom that brings them in today.`,
                null // No choices for open-ended question
            );
            
        case 'contraindications_clearance':
            if (!message.toLowerCase().includes('yes')) {
                session.phase = 'report_complete';
                return formatResponse(
                    `I'm sorry, but we cannot proceed with the assessment without proper medical clearance for the contraindication. 
                    
Please have ${patientName} obtain written clearance from their GP before we can continue with bioelectronic therapy.
                    
Assessment terminated for safety reasons.`,
                    null
                );
            }
            
            session.phase = 'primary_concern';
            return formatResponse(
                `Medical clearance noted. We can proceed with caution.
                
Dr. ${practitionerName}, please ask ${patientName} to describe ${gender === 'Male' ? 'his' : 'her'} PRIMARY health concern or main symptom.`,
                null
            );
            
        case 'primary_concern':
            session.primaryConcern = message;
            session.symptoms = [message]; // Reset symptoms array with primary concern
            session.phase = 'severity';
            
            return formatResponse(
                `I understand ${patientName}'s primary concern is: "${message}"
            
Dr. ${practitionerName}, please ask ${patientName} to rate the severity of this condition on a scale of 1 to 10, where 1 is mild and 10 is severe.`,
                ["1-2 (Mild)", "3-4 (Moderate)", "5-6 (Significant)", "7-8 (Severe)", "9-10 (Very Severe)"]
            );
            
        case 'severity':
            // Extract numeric value from the choice
            let severityScore = 5;
            if (message.includes('1-2')) severityScore = 2;
            else if (message.includes('3-4')) severityScore = 4;
            else if (message.includes('5-6')) severityScore = 6;
            else if (message.includes('7-8')) severityScore = 8;
            else if (message.includes('9-10')) severityScore = 10;
            else severityScore = parseInt(message) || 5;
            
            session.severityScores = { primary: severityScore };
            session.phase = 'duration';
            
            return formatResponse(
                `Severity score of ${severityScore}/10 noted.
            
Please ask ${patientName} how long ${gender === 'Male' ? 'he has' : 'she has'} been experiencing this condition?`,
                ["Less than 1 week", "1-4 weeks", "1-3 months", "3-6 months", "6-12 months", "Over 1 year"]
            );
            
        case 'duration':
            session.duration = message;
            session.phase = 'related_symptoms';
            
            return formatResponse(
                `Duration of ${message} recorded.
            
Dr. ${practitionerName}, are there any OTHER symptoms or related health issues ${patientName} is experiencing?`,
                ["Yes, there are other symptoms", "No other symptoms"]
            );
            
        case 'related_symptoms':
            if (message.toLowerCase().includes('yes')) {
                session.phase = 'collect_related_symptoms';
                return formatResponse(
                    `Please describe the additional symptoms ${patientName} is experiencing:`,
                    null
                );
            } else {
                session.phase = 'lifestyle';
                return formatResponse(
                    `No additional symptoms noted.
                    
Now I need to understand ${patientName}'s lifestyle factors. How would you describe ${gender === 'Male' ? 'his' : 'her'} sleep quality?`,
                    ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
                );
            }
            
        case 'collect_related_symptoms':
            session.symptoms.push(message);
            session.phase = 'lifestyle';
            
            return formatResponse(
                `Additional symptoms noted: ${message}
                
Now I need to understand ${patientName}'s lifestyle factors. How would you describe ${gender === 'Male' ? 'his' : 'her'} sleep quality?`,
                ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
            );
            
        case 'lifestyle':
            session.lifestyle = `Sleep quality: ${message}`;
            session.phase = 'stress_levels';
            
            return formatResponse(
                `Sleep quality recorded as ${message}.
                
How would you rate ${patientName}'s current stress levels?`,
                ["Very Low", "Low", "Moderate", "High", "Very High"]
            );
            
        case 'stress_levels':
            session.lifestyle += `, Stress levels: ${message}`;
            session.phase = 'digestive_health';
            
            return formatResponse(
                `Stress level recorded as ${message}.
                
Does ${patientName} experience any digestive issues?`,
                ["No digestive issues", "Occasional discomfort", "Frequent digestive problems", "Chronic digestive conditions"]
            );
            
        case 'digestive_health':
            session.lifestyle += `, Digestive health: ${message}`;
            session.phase = 'energy_levels';
            
            return formatResponse(
                `Digestive status noted.
                
How would you describe ${patientName}'s energy levels throughout the day?`,
                ["Consistently high", "Generally good", "Variable/fluctuating", "Generally low", "Extremely fatigued"]
            );
            
        case 'energy_levels':
            session.lifestyle += `, Energy: ${message}`;
            session.phase = 'medical_history';
            
            return formatResponse(
                `Energy levels recorded.
            
Finally, Dr. ${practitionerName}, does ${patientName} have any relevant medical history, current medications, or previous treatments we should be aware of?`,
                ["Yes, has relevant medical history", "No significant medical history"]
            );
            
        case 'medical_history':
            if (message.toLowerCase().includes('yes')) {
                session.phase = 'collect_medical_history';
                return formatResponse(
                    `Please provide details of ${patientName}'s medical history, medications, and previous treatments:`,
                    null
                );
            } else {
                session.medicalHistory = 'No significant medical history reported';
                session.phase = 'report';
                return formatResponse(generateEnhancedReport(session), null);
            }
            
        case 'collect_medical_history':
            session.medicalHistory = message;
            session.phase = 'report';
            
            return formatResponse(generateEnhancedReport(session), null);
            
        case 'report':
            return formatResponse("Assessment complete. The report has been saved and sent to your records.", null);
            
        default:
            return formatResponse("Please continue with the assessment.", null);
    }
}

// Finally, update the main module.exports response to handle the new format
// In the module.exports function, update the response section:

context.res = {
    status: 200,
    headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    },
    body: {
        success: true,
        sessionId: sessionId,
        message: response.message || response,
        choices: response.choices || [],
        phase: session.phase,
        isComplete: session.phase === 'report_complete' || session.phase === 'report',
        requiresInput: response.requiresInput !== false
    }
};
