const { v4: uuidv4 } = require('uuid');

// All 21 Celloxen therapy codes with full details
const THERAPIES = {
  '101': { name: 'Deep Sleep Renewal Therapy', keywords: ['insomnia', 'sleep', 'awakening', 'nighttime', 'can\'t sleep'] },
  '102': { name: 'Stress Relief Therapy', keywords: ['stress', 'burnout', 'tension', 'overwhelm', 'pressure'] },
  '103': { name: 'Relaxation & Calm Therapy', keywords: ['anxiety', 'nervous', 'restless', 'panic', 'worried'] },
  '104': { name: 'Sleep Quality Therapy', keywords: ['fragmented', 'early wake', 'sleep quality', 'tired'] },
  '201': { name: 'Kidney Vitality Therapy', keywords: ['kidney', 'fluid', 'oedema', 'retention', 'swelling'] },
  '202': { name: 'Kidney Support Therapy', keywords: ['proteinuria', 'kidney function', 'renal'] },
  '203': { name: 'Bladder Comfort Therapy', keywords: ['bladder', 'urgency', 'frequency', 'urinary', 'urination'] },
  '204': { name: 'Urinary Flow Therapy', keywords: ['weak stream', 'prostate', 'BPH', 'hesitancy', 'dribbling'] },
  '301': { name: 'Heart Health Therapy', keywords: ['heart', 'cardiac', 'coronary', 'arrhythmia', 'chest'] },
  '302': { name: 'Blood Pressure Balance Therapy', keywords: ['hypertension', 'blood pressure', 'BP', 'high pressure'] },
  '303': { name: 'Circulation Boost Therapy', keywords: ['circulation', 'cold hands', 'numbness', 'tingling'] },
  '304': { name: 'Cardiovascular Vitality Therapy', keywords: ['endurance', 'athletic', 'metabolic', 'performance'] },
  '401': { name: 'Gout Relief Therapy', keywords: ['gout', 'uric acid', 'joint swelling', 'toe pain'] },
  '402': { name: 'ArthriComfort Therapy', keywords: ['arthritis', 'joint pain', 'stiffness', 'morning stiff'] },
  '403': { name: 'Joint Mobility Therapy', keywords: ['mobility', 'flexibility', 'range motion', 'movement'] },
  '501': { name: 'Wound Healing Therapy', keywords: ['wound', 'ulcer', 'healing', 'sore', 'cut'] },
  '502': { name: 'Vascular Health Therapy', keywords: ['vascular', 'vein', 'lymph', 'atherosclerosis'] },
  '601': { name: 'Digestive Balance Therapy', keywords: ['IBS', 'constipation', 'bloating', 'digestive', 'stomach'] },
  '602': { name: 'Energy Boost Therapy', keywords: ['fatigue', 'tired', 'energy', 'exhaustion', 'weak'] },
  '703': { name: 'Skin Health Therapy', keywords: ['skin', 'eczema', 'psoriasis', 'dermatitis', 'rash'] },
  '100': { name: 'Blood Sugar Balance Therapy', keywords: ['diabetes', 'blood sugar', 'insulin', 'glucose'] },
  '801': { name: 'Total Wellness Package (Detoxification)', keywords: ['detox', 'wellness', 'general', 'prevention'] },
  '802': { name: 'Stress & Relaxation Package', keywords: ['comprehensive', 'multiple', 'overall'] }
};

const sessions = {};

module.exports = async function (context, req) {
    context.log('Health Agent API called');
    
    const action = req.query.action || req.body?.action || 'chat';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = (req.body?.message || '').trim();
    
    // Initialize session if new
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            id: sessionId,
            phase: 'start',
            practitionerName: null,
            patientData: {},
            symptoms: [],
            assessmentAnswers: [],
            contraindications: [],
            recommendedTherapy: null
        };
    }
    
    const session = sessions[sessionId];
    let response = '';
    
    try {
        if (action === 'start') {
            session.phase = 'greeting';
            response = "Welcome to Celloxen Health Assessment. I'm your AI Health Agent. May I have your name, practitioner?";
        } 
        else if (action === 'chat') {
            response = processConversation(session, message);
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
                response: response,
                phase: session.phase
            }
        };
        
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: false,
                message: 'An error occurred. Please try again.',
                error: error.message
            }
        };
    }
};

function processConversation(session, message) {
    const lower = message.toLowerCase();
    
    switch(session.phase) {
        case 'greeting':
            // Extract practitioner name
            session.practitionerName = extractName(message) || message;
            session.phase = 'confirm_assessment';
            return `Thank you, ${session.practitionerName}. Would you like to conduct a health assessment for a patient today?`;
            
        case 'confirm_assessment':
            if (lower.includes('yes')) {
                session.phase = 'patient_registration';
                return "Excellent! Please provide the patient's full name, date of birth (DD/MM/YYYY), and gender (Male/Female).";
            } else {
                return "No problem. When you're ready to conduct an assessment, please say 'yes'.";
            }
            
        case 'patient_registration':
            // Store patient info
            session.patientData = { details: message };
            session.phase = 'ready_check';
            return `Patient registered: ${message}\n\nI'm ready to conduct a holistic health diagnosis. Shall we begin?`;
            
        case 'ready_check':
            if (lower.includes('yes') || lower.includes('begin')) {
                session.phase = 'contra_pacemaker';
                return "Before we begin, I need to check for safety contraindications.\n\n1. Does the patient have a pacemaker or any implanted electronic device?";
            }
            return "Please confirm when you're ready to begin the assessment.";
            
        case 'contra_pacemaker':
            if (lower.includes('yes')) {
                if (lower.includes('doctor') && lower.includes('agreement')) {
                    session.phase = 'contra_pregnancy';
                    return "Proceeding with doctor's agreement. 2. Is the patient pregnant (especially first trimester)?";
                } else {
                    return "This is a contraindication. Does the patient have written agreement from their doctor to proceed? Please answer 'yes with doctor agreement' or 'no'.";
                }
            } else {
                session.phase = 'contra_pregnancy';
                return "2. Is the patient pregnant (especially first trimester)?";
            }
            
        case 'contra_pregnancy':
            if (lower.includes('yes') && !lower.includes('doctor')) {
                return "Pregnancy requires doctor approval. Do you have written agreement? Answer 'yes with doctor agreement' or 'no'.";
            }
            session.phase = 'contra_cancer';
            return "3. Is the patient receiving active cancer treatment?";
            
        case 'contra_cancer':
            if (lower.includes('yes') && !lower.includes('doctor')) {
                return "Active cancer treatment requires doctor approval. Do you have it? Answer 'yes with doctor agreement' or 'no'.";
            }
            session.phase = 'contra_heart';
            return "4. Has the patient had a recent stroke or heart attack (within 6 weeks)?";
            
        case 'contra_heart':
            if (lower.includes('yes') && !lower.includes('doctor')) {
                session.phase = 'terminated';
                return "For patient safety, this assessment cannot continue without doctor's approval. Please refer the patient to their doctor. Session terminated for safety.";
            }
            session.phase = 'assess_main';
            return "Thank you. No concerning contraindications found.\n\nNow let's assess the patient's health. What is the patient's PRIMARY health concern or main symptom?";
            
        case 'assess_main':
            session.symptoms.push(message);
            session.phase = 'assess_duration';
            return "How long has the patient been experiencing this condition? (e.g., 2 weeks, 3 months, 1 year)";
            
        case 'assess_duration':
            session.assessmentAnswers.push(message);
            session.phase = 'assess_severity';
            return "On a scale of 1-10, how severe is this condition? (1=mild, 10=severe)";
            
        case 'assess_severity':
            session.assessmentAnswers.push(message);
            session.phase = 'assess_related';
            return "Are there any other related symptoms or secondary complaints?";
            
        case 'assess_related':
            session.symptoms.push(message);
            session.phase = 'assess_sleep';
            return "Does the patient have any issues with sleep, stress, or anxiety?";
            
        case 'assess_sleep':
            session.symptoms.push(message);
            session.phase = 'assess_digestive';
            return "Any digestive issues or concerns about energy levels?";
            
        case 'assess_digestive':
            session.symptoms.push(message);
            session.phase = 'assess_joints';
            return "Any joint pain, stiffness, or mobility issues?";
            
        case 'assess_joints':
            session.symptoms.push(message);
            session.phase = 'assess_cardio';
            return "Any cardiovascular concerns (heart, blood pressure, circulation)?";
            
        case 'assess_cardio':
            session.symptoms.push(message);
            session.phase = 'assess_diabetes';
            return "Does the patient have diabetes or blood sugar concerns?";
            
        case 'assess_diabetes':
            session.symptoms.push(message);
            session.phase = 'generating_report';
            const therapy = selectBestTherapy(session.symptoms);
            session.recommendedTherapy = therapy;
            return generateFullReport(session, therapy);
            
        case 'generating_report':
            if (lower.includes('restart')) {
                // Reset session
                sessions[session.id] = {
                    id: session.id,
                    phase: 'greeting',
                    practitionerName: null,
                    patientData: {},
                    symptoms: [],
                    assessmentAnswers: [],
                    contraindications: [],
                    recommendedTherapy: null
                };
                return "Starting new assessment. May I have your name, practitioner?";
            } else if (lower.includes('close') || lower.includes('end')) {
                delete sessions[session.id];
                return "Thank you for using Celloxen Health Assessment. Session ended. Goodbye!";
            }
            return "Assessment complete. Type 'restart' for a new assessment or 'close' to end session.";
            
        case 'terminated':
            return "Session terminated for safety. Please refer patient to their doctor.";
            
        default:
            return "Please continue with the assessment.";
    }
}

function selectBestTherapy(symptoms) {
    const allSymptoms = symptoms.join(' ').toLowerCase();
    let bestMatch = { code: '801', name: THERAPIES['801'].name, score: 0 };
    
    // Score each therapy based on keyword matches
    for (const [code, therapy] of Object.entries(THERAPIES)) {
        let score = 0;
        for (const keyword of therapy.keywords) {
            if (allSymptoms.includes(keyword)) {
                score += 10;
            }
        }
        if (score > bestMatch.score) {
            bestMatch = { code, name: therapy.name, score };
        }
    }
    
    // Default to detox if no strong match
    if (bestMatch.score < 10) {
        bestMatch = { code: '801', name: THERAPIES['801'].name, score: 0 };
    }
    
    return bestMatch;
}

function generateFullReport(session, therapy) {
    const date = new Date().toLocaleDateString('en-GB');
    const patient = session.patientData.details || 'Not provided';
    
    return `
=====================================
CELLOXEN HEALTH ASSESSMENT REPORT
=====================================

PATIENT INFORMATION
-------------------
${patient}
Assessment Date: ${date}
Practitioner: ${session.practitionerName}

CHIEF COMPLAINTS
----------------
Primary: ${session.symptoms[0]}
Duration: ${session.assessmentAnswers[0]}
Severity: ${session.assessmentAnswers[1]}/10

CURRENT HEALTH STATE
--------------------
${session.symptoms.map((s, i) => `- ${s}`).join('\n')}

DIAGNOSTIC RATIONALE
--------------------
Based on holistic assessment, the patient presents with symptoms
indicating ${therapy.name.toLowerCase().replace('therapy', 'issues')}.
The Celloxen bioelectromagnetic therapy will address these through
targeted acupoint stimulation.

RECOMMENDED THERAPY
-------------------
Therapy Code: ${therapy.code}
Therapy Name: ${therapy.name}

THERAPY OVERVIEW
----------------
Utilizes 7-36mT magnetic fields to:
- Restore cellular energy balance
- Enhance microcirculation
- Modulate inflammatory responses
- Stimulate natural healing

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
Based on assessment, consider:
- Omega-3 fatty acids (inflammation support)
- Vitamin D3 (immune function)
- Magnesium (muscle/nerve function)
- Probiotics (digestive health)
- CoQ10 (cellular energy)

NOTES
-----
Regular monitoring recommended.
Adjust protocol based on patient response.
Coordinate with patient's healthcare team.

=====================================
Report Generated: ${date}
=====================================

Type 'restart' for new assessment or 'close' to end.`;
}

function extractName(text) {
    // Find capitalized word that could be a name
    const words = text.split(' ');
    for (let word of words) {
        if (word.length > 2 && /^[A-Z][a-z]+$/.test(word)) {
            return word;
        }
    }
    return text.trim();
}
