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

// Session storage
const sessions = {};

module.exports = async function (context, req) {
    context.log('Health Agent API called');
    
    const action = req.query.action || req.body?.action || 'test';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = req.body?.message || '';
    
    // Initialize session if needed
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            id: sessionId,
            phase: 'greeting',
            practitionerName: null,
            patientData: {},
            symptoms: [],
            contraindictionChecks: 0,
            hasContraindications: false
        };
    }
    
    const session = sessions[sessionId];
    
    try {
        let responseBody = {};
        
        switch(action) {
            case 'test':
                responseBody = {
                    success: true,
                    message: "✅ AI Health Agent API is working!",
                    timestamp: new Date().toISOString(),
                    version: "1.0.0",
                    status: "Connected to Azure Functions"
                };
                break;
                
            case 'start':
                session.phase = 'greeting';
                responseBody = {
                    success: true,
                    sessionId: sessionId,
                    message: "Welcome to Celloxen Health Assessment. I'm your AI Health Agent. May I have your name please, practitioner?",
                    phase: "greeting",
                    timestamp: new Date().toISOString()
                };
                break;
                
            case 'chat':
                responseBody = processChat(session, message);
                responseBody.sessionId = sessionId;
                break;
                
            default:
                responseBody = {
                    success: true,
                    message: "Unknown action. Available actions: test, start, chat"
                };
        }
        
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: responseBody
        };
        
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { 
                success: false, 
                error: error.message || 'An error occurred'
            }
        };
    }
};

function processChat(session, message) {
    const lowerMessage = message.toLowerCase();
    
    switch(session.phase) {
        case 'greeting':
            // Extract practitioner name
            session.practitionerName = extractName(message) || message;
            session.phase = 'confirm_assessment';
            return {
                success: true,
                response: `Thank you, ${session.practitionerName}. Would you like to conduct a health assessment for a patient today?`,
                phase: "confirm_assessment"
            };
            
        case 'confirm_assessment':
            if (lowerMessage.includes('yes')) {
                session.phase = 'patient_registration';
                return {
                    success: true,
                    response: "Excellent! Please provide the patient's full name, date of birth, and gender.",
                    phase: "patient_registration"
                };
            } else {
                return {
                    success: true,
                    response: "No problem. When you're ready to conduct an assessment, just let me know.",
                    phase: "confirm_assessment"
                };
            }
            
        case 'patient_registration':
            // Simple parsing - in production would be more sophisticated
            const patientInfo = extractPatientInfo(message);
            if (patientInfo.name) {
                session.patientData = patientInfo;
                session.phase = 'ready_check';
                return {
                    success: true,
                    response: `Thank you. I have registered:\nPatient: ${patientInfo.name}\nDate of Birth: ${patientInfo.dob || 'Please provide'}\nGender: ${patientInfo.gender || 'Please provide'}\n\nI'm ready to conduct a holistic health diagnosis. Shall we begin?`,
                    phase: "ready_check"
                };
            }
            return {
                success: true,
                response: "Please provide the patient's full name, date of birth (DD/MM/YYYY), and gender (Male/Female).",
                phase: "patient_registration"
            };
            
        case 'ready_check':
            if (lowerMessage.includes('yes') || lowerMessage.includes('begin')) {
                session.phase = 'contraindications';
                session.contraindictionChecks = 1;
                return {
                    success: true,
                    response: "Before we begin, I need to check for safety contraindications.\n\n1. Does the patient have a pacemaker or any implanted electronic device?",
                    phase: "contraindications"
                };
            }
            return {
                success: true,
                response: "Please confirm when you're ready to begin the assessment.",
                phase: "ready_check"
            };
            
        case 'contraindications':
            return handleContraindications(session, lowerMessage);
            
        case 'health_assessment':
            return handleHealthAssessment(session, message);
            
        case 'generate_report':
            const report = generateReport(session);
            return {
                success: true,
                response: report,
                phase: "report_complete",
                report: report
            };
            
        case 'report_complete':
            if (lowerMessage.includes('restart') || lowerMessage.includes('new')) {
                // Reset session
                sessions[session.id] = {
                    id: session.id,
                    phase: 'greeting',
                    practitionerName: null,
                    patientData: {},
                    symptoms: [],
                    contraindictionChecks: 0,
                    hasContraindications: false
                };
                return {
                    success: true,
                    response: "Starting new assessment. May I have your name please, practitioner?",
                    phase: "greeting"
                };
            } else if (lowerMessage.includes('close') || lowerMessage.includes('end')) {
                return {
                    success: true,
                    response: "Thank you for using Celloxen Health Assessment. Session ended.",
                    phase: "ended"
                };
            }
            return {
                success: true,
                response: "Report complete. You can 'restart' for a new assessment or 'close' to end.",
                phase: "report_complete"
            };
            
        default:
            return {
                success: true,
                response: "I'm ready to help with the health assessment. Please provide your response.",
                phase: session.phase
            };
    }
}

function handleContraindications(session, message) {
    const contraindications = [
        "pacemaker or implanted electronic device",
        "pregnancy (especially first trimester)",
        "active cancer treatment",
        "severe heart arrhythmias",
        "recent stroke (within 6 weeks)",
        "recent heart attack (within 6 weeks)"
    ];
    
    if (message.includes('yes')) {
        if (!message.includes('doctor') || !message.includes('agreement')) {
            session.hasContraindications = true;
            return {
                success: true,
                response: "This is a contraindication. Does the patient have written agreement from their doctor to proceed? Please answer 'yes with doctor agreement' or 'no'.",
                phase: "contraindications"
            };
        }
    }
    
    if (message.includes('no') && session.hasContraindications && !message.includes('agreement')) {
        return {
            success: true,
            response: "For patient safety, this assessment cannot continue without doctor's approval. Please refer the patient to their doctor. This session will now end for safety reasons.",
            phase: "terminated"
        };
    }
    
    // Move to next contraindication
    session.contraindictionChecks++;
    
    if (session.contraindictionChecks <= contraindications.length) {
        return {
            success: true,
            response: `${session.contraindictionChecks}. Does the patient have ${contraindications[session.contraindictionChecks - 1]}?`,
            phase: "contraindications"
        };
    } else {
        // All contraindications checked
        session.phase = 'health_assessment';
        session.questionIndex = 0;
        return {
            success: true,
            response: "Thank you. No concerning contraindications found.\n\nNow let's assess the patient's health concerns. What is the patient's primary health complaint or symptom?",
            phase: "health_assessment"
        };
    }
}

function handleHealthAssessment(session, message) {
    const questions = [
        "How long has the patient been experiencing this?",
        "On a scale of 1-10, how severe is this condition?",
        "Are there any other related symptoms?",
        "Does the patient have any issues with sleep or stress?",
        "Any digestive or energy concerns?",
        "Any joint pain or mobility issues?",
        "Any cardiovascular or circulation concerns?",
        "Does the patient have diabetes or blood sugar issues?"
    ];
    
    // Store symptom
    session.symptoms.push(message);
    
    if (!session.questionIndex) session.questionIndex = 0;
    
    if (session.questionIndex < questions.length) {
        const nextQuestion = questions[session.questionIndex];
        session.questionIndex++;
        return {
            success: true,
            response: nextQuestion,
            phase: "health_assessment"
        };
    } else {
        // Assessment complete
        const therapy = selectTherapy(session);
        session.recommendedTherapy = therapy;
        session.phase = 'generate_report';
        
        return {
            success: true,
            response: `Based on the assessment, I recommend: ${therapy.name} (Code: ${therapy.code})\n\nGenerating comprehensive report now...`,
            phase: "generate_report"
        };
    }
}

function selectTherapy(session) {
    const symptoms = session.symptoms.join(' ').toLowerCase();
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
    
    // Default to wellness if no match
    if (!bestMatch || highestScore < 10) {
        bestMatch = THERAPY_CODES.WELLNESS[0];
    }
    
    return bestMatch;
}

function generateReport(session) {
    const therapy = session.recommendedTherapy;
    const patient = session.patientData;
    const date = new Date().toLocaleDateString();
    
    return `
========================================
CELLOXEN HEALTH ASSESSMENT REPORT
========================================

PATIENT INFORMATION
-------------------
Name: ${patient.name || 'Not provided'}
Date of Birth: ${patient.dob || 'Not provided'}
Gender: ${patient.gender || 'Not provided'}
Assessment Date: ${date}
Practitioner: ${session.practitionerName}

CHIEF COMPLAINTS
----------------
${session.symptoms[0] || 'General wellness check'}

CURRENT HEALTH STATE
--------------------
${session.symptoms.join('\n')}

RECOMMENDED THERAPY
-------------------
Therapy Code: ${therapy.code}
Therapy Name: ${therapy.name}

TREATMENT PROTOCOL
------------------
Duration: 40-45 minutes per session
Frequency: 2-3 sessions per week
Course Length: 8 weeks
Total Sessions: 16-24 sessions

SUPPLEMENT RECOMMENDATION
-------------------------
- Omega-3 fatty acids
- Vitamin D
- Magnesium
- Probiotics

========================================
Report Complete - ${date}
========================================`;
}

function extractName(message) {
    const words = message.split(' ');
    for (let word of words) {
        if (word.length > 2 && word[0] === word[0].toUpperCase() && /^[A-Za-z]+$/.test(word)) {
            return word;
        }
    }
    return null;
}

function extractPatientInfo(message) {
    const info = {};
    
    // Extract name (capitalized words)
    const nameMatch = message.match(/([A-Z][a-z]+ ?[A-Z]?[a-z]*)/);
    if (nameMatch) info.name = nameMatch[0];
    
    // Extract date
    const dateMatch = message.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/);
    if (dateMatch) info.dob = dateMatch[0];
    
    // Extract gender
    if (message.toLowerCase().includes('male') && !message.toLowerCase().includes('female')) {
        info.gender = 'Male';
    } else if (message.toLowerCase().includes('female')) {
        info.gender = 'Female';
    }
    
    return info;
}
