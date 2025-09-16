const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Therapy codes from Celloxen guide
const THERAPY_CODES = {
    STRESS_ANXIETY: [
        { code: '101', name: 'Deep Sleep Renewal Therapy', conditions: ['insomnia', 'sleep', 'nighttime awakening'] },
        { code: '102', name: 'Stress Relief Therapy', conditions: ['stress', 'burnout', 'tension'] },
        { code: '103', name: 'Relaxation & Calm Therapy', conditions: ['anxiety', 'nervousness', 'restlessness'] },
        { code: '104', name: 'Sleep Quality Therapy', conditions: ['fragmented sleep', 'early awakening'] }
    ],
    KIDNEY_URINARY: [
        { code: '201', name: 'Kidney Vitality Therapy', conditions: ['kidney', 'fluid retention', 'oedema'] },
        { code: '202', name: 'Kidney Support Therapy', conditions: ['kidney insufficiency', 'proteinuria'] },
        { code: '203', name: 'Bladder Comfort Therapy', conditions: ['bladder', 'urgency', 'frequency'] },
        { code: '204', name: 'Urinary Flow Therapy', conditions: ['weak stream', 'prostate', 'BPH'] }
    ],
    CARDIOVASCULAR: [
        { code: '301', name: 'Heart Health Therapy', conditions: ['heart', 'cardiac', 'coronary'] },
        { code: '302', name: 'Blood Pressure Balance Therapy', conditions: ['hypertension', 'blood pressure', 'BP'] },
        { code: '303', name: 'Circulation Boost Therapy', conditions: ['circulation', 'cold hands', 'numbness'] },
        { code: '304', name: 'Cardiovascular Vitality Therapy', conditions: ['athletic', 'endurance', 'metabolic'] }
    ],
    JOINT_ARTHRITIS: [
        { code: '401', name: 'Gout Relief Therapy', conditions: ['gout', 'uric acid', 'joint pain'] },
        { code: '402', name: 'ArthriComfort Therapy', conditions: ['arthritis', 'osteoarthritis', 'stiffness'] },
        { code: '403', name: 'Joint Mobility Therapy', conditions: ['mobility', 'flexibility', 'range of motion'] }
    ],
    HEALING: [
        { code: '501', name: 'Wound Healing Therapy', conditions: ['wound', 'ulcer', 'healing'] },
        { code: '502', name: 'Vascular Health Therapy', conditions: ['vascular', 'vein', 'lymph'] }
    ],
    DIGESTIVE_ENERGY: [
        { code: '601', name: 'Digestive Balance Therapy', conditions: ['IBS', 'constipation', 'bloating', 'digestive'] },
        { code: '602', name: 'Energy Boost Therapy', conditions: ['fatigue', 'tired', 'energy', 'exhaustion'] },
        { code: '703', name: 'Skin Health Therapy', conditions: ['skin', 'eczema', 'psoriasis'] }
    ],
    DIABETES: [
        { code: '100', name: 'Blood Sugar Balance Therapy', conditions: ['diabetes', 'blood sugar', 'insulin'] }
    ],
    WELLNESS: [
        { code: '801', name: 'Total Wellness Package', conditions: ['wellness', 'prevention', 'multiple'] },
        { code: '802', name: 'Stress & Relaxation Package', conditions: ['burnout', 'comprehensive stress'] }
    ]
};

// Contraindications
const CONTRAINDICATIONS = [
    "pacemaker or implanted electronic device",
    "pregnancy (especially first trimester)",
    "active cancer treatment",
    "severe heart arrhythmias",
    "recent stroke (within 6 weeks)",
    "recent heart attack (within 6 weeks)"
];

// Session storage (in production, use database)
const sessions = {};

module.exports = async function (context, req) {
    context.log('Health Agent API called');
    
    const action = req.query.action || req.body?.action || 'chat';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = req.body?.message || '';
    
    // Initialize or get session
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            id: sessionId,
            phase: 'greeting',
            conversationHistory: [],
            practitionerName: null,
            patientData: {},
            assessmentData: {},
            contraindications: [],
            recommendedTherapy: null,
            report: null
        };
    }
    
    const session = sessions[sessionId];
    
    try {
        let response = '';
        
        if (action === 'start') {
            session.phase = 'greeting';
            response = await callClaude(session, "greeting", "");
        } else if (action === 'chat') {
            // Add user message to history
            session.conversationHistory.push({
                role: 'user',
                content: message
            });
            
            // Process based on current phase
            response = await processPhase(session, message);
            
            // Add assistant response to history
            session.conversationHistory.push({
                role: 'assistant',
                content: response
            });
        } else if (action === 'report') {
            response = generateReport(session);
        } else if (action === 'restart') {
            delete sessions[sessionId];
            response = "Assessment restarted. Starting new session...";
        }
        
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                sessionId: sessionId,
                phase: session.phase,
                response: response,
                report: session.report
            }
        };
        
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                error: error.message
            }
        };
    }
};

async function callClaude(session, phase, userMessage) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const apiUrl = 'https://api.anthropic.com/v1/messages';
    
    const systemPrompt = buildSystemPrompt(phase, session);
    const userPrompt = buildUserPrompt(phase, userMessage, session);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [
                    ...session.conversationHistory,
                    { role: 'user', content: userPrompt }
                ],
                system: systemPrompt
            })
        });
        
        const data = await response.json();
        return data.content[0].text;
        
    } catch (error) {
        console.error('Claude API error:', error);
        return getFallbackResponse(phase);
    }
}

function buildSystemPrompt(phase, session) {
    let basePrompt = `You are an AI Health Assessment Agent for Celloxen Health Therapy clinic. You are conducting a holistic health assessment for practitioners to use with their patients.

Current assessment phase: ${phase}
Practitioner: ${session.practitionerName || 'Not yet provided'}
Patient: ${session.patientData.name || 'Not yet registered'}

Available Celloxen therapies: ${JSON.stringify(THERAPY_CODES)}
Contraindications to check: ${JSON.stringify(CONTRAINDICATIONS)}

Your role is to:
1. Guide the practitioner through patient assessment
2. Screen for contraindications
3. Identify suitable Celloxen therapy based on symptoms
4. Generate comprehensive health reports
5. Recommend appropriate supplements

Be professional, thorough, and empathetic. Focus on holistic health assessment within the scope of available therapies.`;

    return basePrompt;
}

function buildUserPrompt(phase, userMessage, session) {
    switch(phase) {
        case 'greeting':
            return "Start the assessment by greeting the practitioner warmly, ask for their name, and ask if they want to conduct a health assessment for a patient.";
        
        case 'practitioner_name':
            return `The practitioner said: "${userMessage}". Extract their name, welcome them by name, and ask if they want to conduct a health assessment for a patient.`;
        
        case 'patient_registration':
            return "Ask for the patient's full name, date of birth, and gender. Be clear that you need all three pieces of information.";
        
        case 'ready_check':
            return "Confirm you're ready to conduct a holistic health diagnosis and ask if the practitioner is ready to begin.";
        
        case 'contraindications':
            return `Check each contraindication one by one. Current checking: ${session.currentContraindication || 'first one'}. Ask clearly about: pacemaker/implanted devices, pregnancy, active cancer treatment, severe arrhythmias, recent stroke or heart attack.`;
        
        case 'health_assessment':
            return `Based on user response: "${userMessage}", continue the health assessment. Ask about symptoms related to: stress/anxiety/sleep, kidney/urinary issues, cardiovascular health, joint pain/arthritis, circulation, digestive/energy, diabetes, or general wellness. Be thorough but conversational.`;
        
        case 'therapy_selection':
            return `Based on all collected symptoms: ${JSON.stringify(session.assessmentData)}, determine the most suitable Celloxen therapy from the available options and explain why.`;
        
        default:
            return userMessage;
    }
}

async function processPhase(session, message) {
    const lowerMessage = message.toLowerCase();
    
    switch(session.phase) {
        case 'greeting':
            session.phase = 'practitioner_name';
            return await callClaude(session, 'practitioner_name', message);
        
        case 'practitioner_name':
            // Extract practitioner name
            session.practitionerName = extractName(message);
            
            if (lowerMessage.includes('yes') || lowerMessage.includes('conduct') || lowerMessage.includes('assessment')) {
                session.phase = 'patient_registration';
                return await callClaude(session, 'patient_registration', message);
            }
            return "Would you like to conduct a health assessment for a patient today?";
        
        case 'patient_registration':
            // Parse patient data
            const patientInfo = extractPatientInfo(message);
            if (patientInfo.name && patientInfo.dob && patientInfo.gender) {
                session.patientData = patientInfo;
                session.phase = 'ready_check';
                return `Thank you. I have registered:\nPatient: ${patientInfo.name}\nDate of Birth: ${patientInfo.dob}\nGender: ${patientInfo.gender}\n\nI'm ready to conduct a holistic health diagnosis. Shall we begin?`;
            }
            return "Please provide the patient's full name, date of birth, and gender.";
        
        case 'ready_check':
            if (lowerMessage.includes('yes') || lowerMessage.includes('ready') || lowerMessage.includes('begin')) {
                session.phase = 'contraindications';
                session.contraindicationIndex = 0;
                return `Before we begin, I need to check for safety contraindications.\n\nDoes the patient have any of the following:\n1. A pacemaker or any implanted electronic device?`;
            }
            return "Please confirm when you're ready to begin the assessment.";
        
        case 'contraindications':
            return handleContraindications(session, message);
        
        case 'health_assessment':
            return handleHealthAssessment(session, message);
        
        case 'therapy_selection':
            const therapy = selectTherapy(session);
            session.recommendedTherapy = therapy;
            session.phase = 'report_generation';
            return generateReport(session);
        
        case 'report_generation':
            if (lowerMessage.includes('close') || lowerMessage.includes('end')) {
                return "Thank you for using Celloxen Health Assessment. Session ended.";
            }
            if (lowerMessage.includes('restart') || lowerMessage.includes('new')) {
                session.phase = 'greeting';
                return "Starting new assessment...";
            }
            return "Report generated. You can close this assessment or start a new one.";
        
        default:
            return await callClaude(session, session.phase, message);
    }
}

function handleContraindications(session, message) {
    const lowerMessage = message.toLowerCase();
    const contraindicationsList = [
        "pacemaker or implanted electronic device",
        "pregnancy",
        "active cancer treatment",
        "severe heart arrhythmias",
        "recent stroke (within 6 weeks)",
        "recent heart attack (within 6 weeks)"
    ];
    
    if (!session.contraindicationIndex) {
        session.contraindicationIndex = 0;
    }
    
    // Record answer for current contraindication
    if (lowerMessage.includes('yes')) {
        session.contraindications.push(contraindicationsList[session.contraindicationIndex]);
        
        // Check if doctor's agreement is provided
        if (lowerMessage.includes('doctor') && lowerMessage.includes('agree')) {
            // Continue with doctor's agreement
        } else {
            return "This is a contraindication. Does the patient have written agreement from their doctor to proceed with this therapy? If not, please refer the patient to their doctor first. Type 'yes with doctor agreement' to continue or 'no' to stop.";
        }
    }
    
    // Check if this is a stop condition
    if (lowerMessage.includes('no') && session.contraindications.length > 0 && !lowerMessage.includes('doctor')) {
        session.phase = 'terminated';
        return "For patient safety, this assessment cannot continue without doctor's approval. Please refer the patient to their doctor. This chat will now be terminated for safety reasons.";
    }
    
    // Move to next contraindication
    session.contraindicationIndex++;
    
    if (session.contraindicationIndex < contraindicationsList.length) {
        return `${session.contraindicationIndex + 1}. Does the patient have ${contraindicationsList[session.contraindicationIndex]}?`;
    } else {
        // All contraindications checked
        session.phase = 'health_assessment';
        session.assessmentQuestionIndex = 0;
        return "Thank you for confirming. No concerning contraindications found. Now let's assess the patient's health concerns.\n\nWhat is the patient's primary health concern or symptom they're experiencing?";
    }
}

function handleHealthAssessment(session, message) {
    // Store symptom data
    if (!session.assessmentData.symptoms) {
        session.assessmentData.symptoms = [];
    }
    session.assessmentData.symptoms.push(message);
    
    // Assessment questions flow
    const assessmentQuestions = [
        "How long has the patient been experiencing this?",
        "On a scale of 1-10, how severe is this condition?",
        "Are there any other related symptoms?",
        "Does the patient have any issues with sleep or stress?",
        "Any digestive or energy concerns?",
        "Any joint pain or mobility issues?",
        "Any cardiovascular or circulation concerns?",
        "Does the patient have diabetes or blood sugar issues?"
    ];
    
    if (!session.assessmentQuestionIndex) {
        session.assessmentQuestionIndex = 0;
    }
    
    session.assessmentQuestionIndex++;
    
    if (session.assessmentQuestionIndex < assessmentQuestions.length) {
        return assessmentQuestions[session.assessmentQuestionIndex];
    } else {
        // Assessment complete, select therapy
        session.phase = 'therapy_selection';
        return processTherapySelection(session);
    }
}

function selectTherapy(session) {
    const symptoms = session.assessmentData.symptoms.join(' ').toLowerCase();
    
    // Score each therapy based on symptom matching
    let bestMatch = null;
    let highestScore = 0;
    
    for (const category of Object.values(THERAPY_CODES)) {
        for (const therapy of category) {
            let score = 0;
            for (const condition of therapy.conditions) {
                if (symptoms.includes(condition)) {
                    score += 10;
                }
            }
            if (score > highestScore) {
                highestScore = score;
                bestMatch = therapy;
            }
        }
    }
    
    // Default to detoxification/wellness if no specific match
    if (!bestMatch || highestScore < 10) {
        bestMatch = {
            code: '801',
            name: 'Total Wellness Package (Detoxification)',
            description: 'Comprehensive wellness and detoxification therapy'
        };
    }
    
    return bestMatch;
}

function generateReport(session) {
    const therapy = session.recommendedTherapy || selectTherapy(session);
    const patient = session.patientData;
    const date = new Date().toLocaleDateString();
    
    const report = `
CELLOXEN HEALTH ASSESSMENT REPORT
==================================

PATIENT INFORMATION
-------------------
Name: ${patient.name || 'Not provided'}
Date of Birth: ${patient.dob || 'Not provided'}
Gender: ${patient.gender || 'Not provided'}
Assessment Date: ${date}
Practitioner: ${session.practitionerName}

CHIEF COMPLAINTS
----------------
${session.assessmentData.symptoms ? session.assessmentData.symptoms[0] : 'General wellness check'}

CURRENT HEALTH STATE
--------------------
Based on the assessment, the patient presents with:
${session.assessmentData.symptoms ? session.assessmentData.symptoms.join('\n- ') : 'No specific symptoms reported'}

DIAGNOSTIC RATIONALE
--------------------
After thorough holistic assessment, considering the patient's symptoms and health history, 
the following therapy is recommended based on symptom correlation and expected therapeutic benefits.

RECOMMENDED THERAPY
-------------------
Therapy Code: ${therapy.code}
Therapy Name: ${therapy.name}

THERAPY OVERVIEW
----------------
This therapy uses bioelectromagnetic fields to stimulate specific acupoints, promoting:
- Natural healing processes
- Cellular energy balance
- Improved circulation
- Symptom relief

ANTICIPATED BENEFITS
--------------------
Week 1-2: Initial symptom relief
Week 3-4: Progressive improvement
Week 5-6: Significant enhancement
Week 7-8: Sustained benefits

TREATMENT PROTOCOL
------------------
Duration: 40-45 minutes per session
Frequency: 2-3 sessions per week
Course Length: 8 weeks
Total Sessions: 16-24 sessions

SUPPLEMENT RECOMMENDATION
-------------------------
Based on the patient's condition, consider:
- Omega-3 fatty acids for inflammation support
- Vitamin D for immune support
- Magnesium for muscle and nerve function
- Probiotics for digestive health

NOTES
-----
This assessment is complementary to conventional medical care.
Regular monitoring and adjustment of treatment plan recommended.

Practitioner Signature: _____________________
Date: ${date}
`;
    
    session.report = report;
    session.phase = 'report_generation';
    
    return report;
}

function extractName(message) {
    // Simple name extraction - could be improved with NLP
    const words = message.split(' ');
    for (let word of words) {
        if (word.length > 2 && word[0] === word[0].toUpperCase()) {
            return word;
        }
    }
    return message.trim();
}

function extractPatientInfo(message) {
    // Parse patient information from message
    // This is simplified - in production use better parsing
    const info = {};
    
    // Try to extract name (capitalized words)
    const nameMatch = message.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (nameMatch) info.name = nameMatch[1];
    
    // Try to extract date
    const dateMatch = message.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
    if (dateMatch) info.dob = dateMatch[1];
    
    // Try to extract gender
    if (message.toLowerCase().includes('male') && !message.toLowerCase().includes('female')) {
        info.gender = 'Male';
    } else if (message.toLowerCase().includes('female')) {
        info.gender = 'Female';
    }
    
    return info;
}

function processTherapySelection(session) {
    const therapy = selectTherapy(session);
    session.recommendedTherapy = therapy;
    
    return `Based on the assessment, I recommend:\n\n${therapy.name} (Code: ${therapy.code})\n\nThis therapy will help address the patient's symptoms through targeted bioelectromagnetic stimulation.\n\nWould you like me to generate the complete assessment report now?`;
}

function getFallbackResponse(phase) {
    const fallbacks = {
        'greeting': "Welcome to Celloxen Health Assessment. I'm your AI Health Agent. May I have your name, and would you like to conduct a health assessment for a patient?",
        'patient_registration': "Please provide the patient's full name, date of birth, and gender.",
        'contraindications': "I need to check for safety contraindications. Does the patient have any pacemakers or implanted devices?",
        'health_assessment': "What are the main health concerns the patient is experiencing?",
        'report_generation': "Assessment complete. Report has been generated."
    };
    
    return fallbacks[phase] || "How can I help you with the health assessment?";
}
