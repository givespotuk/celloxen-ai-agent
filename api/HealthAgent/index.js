const { v4: uuidv4 } = require('uuid');

// All 21 Celloxen therapies
const THERAPIES = {
  '101': { name: 'Deep Sleep Renewal Therapy', keywords: ['insomnia', 'sleep', 'awakening', 'nighttime'] },
  '102': { name: 'Stress Relief Therapy', keywords: ['stress', 'burnout', 'tension', 'overwhelm'] },
  '103': { name: 'Relaxation & Calm Therapy', keywords: ['anxiety', 'nervous', 'restless', 'panic'] },
  '104': { name: 'Sleep Quality Therapy', keywords: ['fragmented', 'early wake', 'sleep quality'] },
  '201': { name: 'Kidney Vitality Therapy', keywords: ['kidney', 'fluid', 'oedema', 'retention'] },
  '202': { name: 'Kidney Support Therapy', keywords: ['proteinuria', 'kidney function'] },
  '203': { name: 'Bladder Comfort Therapy', keywords: ['bladder', 'urgency', 'frequency', 'urinary'] },
  '204': { name: 'Urinary Flow Therapy', keywords: ['weak stream', 'prostate', 'BPH', 'hesitancy'] },
  '301': { name: 'Heart Health Therapy', keywords: ['heart', 'cardiac', 'coronary', 'arrhythmia'] },
  '302': { name: 'Blood Pressure Balance Therapy', keywords: ['hypertension', 'blood pressure', 'BP'] },
  '303': { name: 'Circulation Boost Therapy', keywords: ['circulation', 'cold hands', 'numbness'] },
  '304': { name: 'Cardiovascular Vitality Therapy', keywords: ['endurance', 'athletic', 'metabolic'] },
  '401': { name: 'Gout Relief Therapy', keywords: ['gout', 'uric acid', 'joint swelling'] },
  '402': { name: 'ArthriComfort Therapy', keywords: ['arthritis', 'joint pain', 'stiffness'] },
  '403': { name: 'Joint Mobility Therapy', keywords: ['mobility', 'flexibility', 'range motion'] },
  '501': { name: 'Wound Healing Therapy', keywords: ['wound', 'ulcer', 'healing', 'sore'] },
  '502': { name: 'Vascular Health Therapy', keywords: ['vascular', 'vein', 'lymph', 'atherosclerosis'] },
  '601': { name: 'Digestive Balance Therapy', keywords: ['IBS', 'constipation', 'bloating', 'digestive'] },
  '602': { name: 'Energy Boost Therapy', keywords: ['fatigue', 'tired', 'energy', 'exhaustion'] },
  '703': { name: 'Skin Health Therapy', keywords: ['skin', 'eczema', 'psoriasis', 'dermatitis'] },
  '100': { name: 'Blood Sugar Balance Therapy', keywords: ['diabetes', 'blood sugar', 'insulin'] },
  '801': { name: 'Total Wellness Package', keywords: ['detox', 'wellness', 'general', 'prevention'] }
};

const sessions = {};

module.exports = async function (context, req) {
    const action = req.query.action || req.body?.action || 'chat';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = (req.body?.message || '').trim();
    
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            phase: 'start',
            practitioner: null,
            patient: {},
            symptoms: [],
            contraCheck: 0
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
            const lower = message.toLowerCase();
            
            switch(session.phase) {
                case 'greeting':
                    session.practitioner = message.split(' ')[0];
                    session.phase = 'confirm';
                    response = `Thank you, ${session.practitioner}. Would you like to conduct a health assessment for a patient?`;
                    break;
                    
                case 'confirm':
                    if (lower.includes('yes')) {
                        session.phase = 'patient';
                        response = "Please provide the patient's full name, date of birth, and gender.";
                    } else {
                        response = "No problem. Say 'yes' when ready to begin.";
                    }
                    break;
                    
                case 'patient':
                    session.patient = { info: message };
                    session.phase = 'ready';
                    response = `Patient registered. I'm ready to conduct a holistic health diagnosis. Shall we begin?`;
                    break;
                    
                case 'ready':
                    if (lower.includes('yes')) {
                        session.phase = 'contra1';
                        response = "Safety check: Does the patient have a pacemaker or implanted device?";
                    }
                    break;
                    
                case 'contra1':
                    if (lower.includes('yes')) {
                        session.phase = 'doctor';
                        response = "Doctor's written agreement required. Do you have it? (yes/no)";
                    } else {
                        session.phase = 'contra2';
                        response = "Is the patient pregnant?";
                    }
                    break;
                    
                case 'doctor':
                    if (!lower.includes('yes')) {
                        response = "Cannot proceed without doctor approval. Please refer patient to doctor. Session terminated for safety.";
                        delete sessions[sessionId];
                        break;
                    }
                    session.phase = 'contra2';
                    response = "Proceeding with doctor approval. Is the patient pregnant?";
                    break;
                    
                case 'contra2':
                    session.phase = 'contra3';
                    response = "Active cancer treatment?";
                    break;
                    
                case 'contra3':
                    session.phase = 'contra4';
                    response = "Recent stroke or heart attack (within 6 weeks)?";
                    break;
                    
                case 'contra4':
                    session.phase = 'assess1';
                    response = "Safety checks complete. What is the patient's main health concern?";
                    break;
                    
                case 'assess1':
                    session.symptoms.push(message);
                    session.phase = 'assess2';
                    response = "How long has this been occurring?";
                    break;
                    
                case 'assess2':
                    session.symptoms.push(message);
                    session.phase = 'assess3';
                    response = "Severity scale 1-10?";
                    break;
                    
                case 'assess3':
                    session.symptoms.push(message);
                    session.phase = 'assess4';
                    response = "Any sleep or stress issues?";
                    break;
                    
                case 'assess4':
                    session.symptoms.push(message);
                    session.phase = 'assess5';
                    response = "Any digestive or energy concerns?";
                    break;
                    
                case 'assess5':
                    session.symptoms.push(message);
                    session.phase = 'report';
                    const therapy = selectTherapy(session.symptoms);
                    response = generateReport(session, therapy);
                    break;
                    
                case 'report':
                    if (lower.includes('restart')) {
                        delete sessions[sessionId];
                        response = "New assessment started. May I have your name, practitioner?";
                    } else if (lower.includes('close')) {
                        response = "Session ended. Thank you.";
                        delete sessions[sessionId];
                    } else {
                        response = "Type 'restart' for new assessment or 'close' to end.";
                    }
                    break;
            }
        }
        
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                sessionId: sessionId,
                response: response || "Ready",
                phase: session.phase
            }
        };
        
    } catch (error) {
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { success: false, error: error.message }
        };
    }
};

function selectTherapy(symptoms) {
    const text = symptoms.join(' ').toLowerCase();
    let bestMatch = { code: '801', score: 0 };
    
    for (const [code, therapy] of Object.entries(THERAPIES)) {
        let score = 0;
        for (const keyword of therapy.keywords) {
            if (text.includes(keyword)) score += 10;
        }
        if (score > bestMatch.score) {
            bestMatch = { code, score, name: therapy.name };
        }
    }
    
    return bestMatch;
}

function generateReport(session, therapy) {
    return `
CELLOXEN HEALTH ASSESSMENT REPORT
==================================
Practitioner: ${session.practitioner}
Patient: ${session.patient.info}
Date: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT
${session.symptoms[0]}

ASSESSMENT FINDINGS
Duration: ${session.symptoms[1]}
Severity: ${session.symptoms[2]}/10
Additional: ${session.symptoms.slice(3).join(', ')}

RECOMMENDED THERAPY
Code: ${therapy.code}
Name: ${therapy.name}

PROTOCOL
- Duration: 40-45 min/session
- Frequency: 2-3x/week
- Course: 8 weeks (16-24 sessions)

SUPPLEMENTS
- Omega-3, Vitamin D, Magnesium, Probiotics

==================================
Type 'restart' or 'close'`;
}
