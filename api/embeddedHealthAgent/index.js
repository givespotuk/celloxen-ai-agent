const { v4: uuidv4 } = require('uuid');
const db = require('../shared/database');

// Keep all existing THERAPIES
const THERAPIES = {
  '101': { name: 'Deep Sleep Renewal Therapy', keywords: ['insomnia', 'sleep', 'awakening', 'nighttime', 'can\'t sleep'], priority: ['sleep'] },
  '102': { name: 'Stress Relief Therapy', keywords: ['stress', 'burnout', 'tension', 'overwhelm', 'pressure'], priority: ['stress', 'work'] },
  '103': { name: 'Relaxation & Calm Therapy', keywords: ['anxiety', 'nervous', 'restless', 'panic', 'worried'], priority: ['anxiety'] },
  '104': { name: 'Sleep Quality Therapy', keywords: ['fragmented', 'early wake', 'sleep quality', 'tired'], priority: ['quality'] },
  '201': { name: 'Kidney Vitality Therapy', keywords: ['kidney', 'fluid', 'oedema', 'retention', 'swelling'], priority: ['kidney'] },
  '202': { name: 'Kidney Support Therapy', keywords: ['proteinuria', 'kidney function', 'renal'], priority: ['renal'] },
  '203': { name: 'Bladder Comfort Therapy', keywords: ['bladder', 'urgency', 'frequency', 'urinary', 'urination'], priority: ['bladder'] },
  '204': { name: 'Urinary Flow Therapy', keywords: ['weak stream', 'prostate', 'BPH', 'hesitancy', 'dribbling'], priority: ['prostate'] },
  '301': { name: 'Heart Health Therapy', keywords: ['heart', 'cardiac', 'coronary', 'arrhythmia', 'chest'], priority: ['heart'] },
  '302': { name: 'Blood Pressure Balance Therapy', keywords: ['hypertension', 'blood pressure', 'BP', 'high pressure'], priority: ['pressure'] },
  '303': { name: 'Circulation Boost Therapy', keywords: ['circulation', 'cold hands', 'numbness', 'tingling'], priority: ['circulation'] },
  '304': { name: 'Cardiovascular Vitality Therapy', keywords: ['endurance', 'athletic', 'metabolic', 'performance'], priority: ['athletic'] },
  '401': { name: 'Gout Relief Therapy', keywords: ['gout', 'uric acid', 'joint swelling', 'toe pain'], priority: ['gout'] },
  '402': { name: 'ArthriComfort Therapy', keywords: ['arthritis', 'joint pain', 'stiffness', 'morning stiff'], priority: ['arthritis'] },
  '403': { name: 'Joint Mobility Therapy', keywords: ['mobility', 'flexibility', 'range motion', 'movement'], priority: ['mobility'] },
  '501': { name: 'Wound Healing Therapy', keywords: ['wound', 'ulcer', 'healing', 'sore', 'cut'], priority: ['wound'] },
  '502': { name: 'Vascular Health Therapy', keywords: ['vascular', 'vein', 'lymph', 'atherosclerosis'], priority: ['vascular'] },
  '601': { name: 'Digestive Balance Therapy', keywords: ['IBS', 'constipation', 'bloating', 'digestive', 'stomach'], priority: ['digestive'] },
  '602': { name: 'Energy Boost Therapy', keywords: ['fatigue', 'tired', 'energy', 'exhaustion', 'weak'], priority: ['energy'] },
  '703': { name: 'Skin Health Therapy', keywords: ['skin', 'eczema', 'psoriasis', 'dermatitis', 'rash'], priority: ['skin'] },
  '100': { name: 'Blood Sugar Balance Therapy', keywords: ['diabetes', 'blood sugar', 'insulin', 'glucose'], priority: ['diabetes'] },
  '801': { name: 'Total Wellness Package (Detoxification)', keywords: ['detox', 'wellness', 'general', 'prevention'], priority: ['general'] },
  '802': { name: 'Stress & Relaxation Package', keywords: ['comprehensive', 'multiple', 'overall'], priority: ['multiple'] }
};

const embeddedSessions = {};

module.exports = async function (context, req) {
    const action = req.body?.action || 'chat';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = (req.body?.message || '').trim();
    const clinicId = req.body?.clinicId;
    const patientId = req.body?.patientId;
    const patientName = req.body?.patientName;
    const useBotService = req.body?.useBotService || false; // Flag to use new bot service
    
    // Try to use the new bot service if available
    if (useBotService && process.env.BOT_APP_ID && process.env.BOT_APP_PASSWORD) {
        try {
            const fetch = require('node-fetch');
            
            if (action === 'start') {
                // Get patient details from database
                let patientData = {
                    name: patientName || 'Patient',
                    dob: '1980-01-01',
                    gender: 'Not specified'
                };
                
                if (patientId) {
                    const { Pool } = require('pg');
                    const pool = new Pool({
                        host: process.env.DB_HOST,
                        database: process.env.DB_NAME,
                        user: process.env.DB_USER,
                        password: process.env.DB_PASSWORD,
                        port: 5432,
                        ssl: { rejectUnauthorized: false }
                    });
                    
                    const result = await pool.query(
                        'SELECT full_name, first_name, last_name, date_of_birth, gender FROM patients WHERE patient_id = $1',
                        [patientId]
                    );
                    
                    if (result.rows.length > 0) {
                        const patient = result.rows[0];
                        patientData.name = patient.full_name || `${patient.first_name} ${patient.last_name}`;
                        patientData.dob = patient.date_of_birth || '1980-01-01';
                        patientData.gender = patient.gender || 'Not specified';
                    }
                    
                    await pool.end();
                }
                
                // Call bot service
                const apiUrl = process.env.API_URL || 'https://celloxen.com';
                const botResponse = await fetch(`${apiUrl}/api/botService`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'startHolisticAssessment',
                        sessionId: sessionId,
                        clinicId: clinicId,
                        practitionerName: 'Clinic Staff',
                        patientData: patientData
                    })
                });
                
                if (botResponse.ok) {
                    const botData = await botResponse.json();
                    context.res = {
                        status: 200,
                        headers: { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: {
                            success: true,
                            sessionId: sessionId,
                            message: botData.message,
                            phase: botData.phase,
                            usingBot: true
                        }
                    };
                    return;
                }
            } else {
                // Continue with bot service
                const apiUrl = process.env.API_URL || 'https://celloxen.com';
                const botResponse = await fetch(`${apiUrl}/api/botService`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'continueAssessment',
                        sessionId: sessionId,
                        clinicId: clinicId,
                        message: message
                    })
                });
                
                if (botResponse.ok) {
                    const botData = await botResponse.json();
                    
                    // Update patient last assessment date if complete
                    if (botData.isComplete && patientId) {
                        const { Pool } = require('pg');
                        const pool = new Pool({
                            host: process.env.DB_HOST,
                            database: process.env.DB_NAME,
                            user: process.env.DB_USER,
                            password: process.env.DB_PASSWORD,
                            port: 5432,
                            ssl: { rejectUnauthorized: false }
                        });
                        
                        await pool.query(
                            'UPDATE patients SET last_assessment_date = NOW() WHERE patient_id = $1',
                            [patientId]
                        );
                        await pool.end();
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
                            message: botData.message,
                            phase: botData.phase,
                            isComplete: botData.isComplete,
                            usingBot: true
                        }
                    };
                    return;
                }
            }
        } catch (botError) {
            context.log('Bot service error, falling back to original:', botError);
            // Fall through to original implementation
        }
    }
    
    // Original implementation (fallback or when bot service not available)
    if (!embeddedSessions[sessionId]) {
        embeddedSessions[sessionId] = {
            id: sessionId,
            phase: 'ready_check',
            clinicId: clinicId,
            patientId: patientId,
            patientName: patientName,
            patientData: { details: patientName },
            practitionerName: 'Clinic Staff',
            symptoms: [],
            assessmentAnswers: [],
            contraindications: [],
            recommendedTherapy: null,
            aiAnalysis: null
        };
        
        try {
            await db.saveSession({
                sessionId: sessionId,
                clinicId: clinicId,
                practitionerName: 'Clinic Staff',
                patientName: patientName
            });
        } catch (dbError) {
            console.log('DB error (non-critical):', dbError);
        }
    }
    
    const session = embeddedSessions[sessionId];
    let response = '';
    
    if (action === 'start') {
        response = `Starting assessment for ${patientName}.\n\nReady to begin the health assessment? Type 'yes' to continue.`;
    } else {
        response = await processEmbeddedConversation(session, message);
    }
    
    try {
        await db.saveMessage(sessionId, 'user', message, session.phase);
        await db.saveMessage(sessionId, 'assistant', response, session.phase);
    } catch (dbError) {
        console.log('DB save error (non-critical):', dbError);
    }
    
    if (session.phase === 'report_complete' && patientId) {
        try {
            const { Pool } = require('pg');
            const pool = new Pool({
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                port: 5432,
                ssl: { rejectUnauthorized: false }
            });
            
            await pool.query(
                'UPDATE patients SET last_assessment_date = NOW() WHERE patient_id = $1',
                [patientId]
            );
            await pool.end();
        } catch (err) {
            console.log('Error updating last assessment date:', err);
        }
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
            phase: session.phase,
            usingBot: false
        }
    };
};

// Keep all existing functions unchanged
async function processEmbeddedConversation(session, message) {
    const lower = message.toLowerCase();
    
    switch(session.phase) {
        case 'ready_check':
            if (lower.includes('yes') || lower.includes('ready') || lower.includes('start') || lower.includes('ok')) {
                session.phase = 'contra_pacemaker';
                return "I need to check for safety contraindications.\n\n1. Does the patient have a pacemaker or any implanted electronic device?";
            }
            return "Type 'yes' when ready to begin the assessment.";
            
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
            
            const therapy = selectBestTherapy(session);
            session.recommendedTherapy = therapy;
            session.phase = 'report_complete';
            
            const fullReport = generateReport(session, therapy);
            
            try {
                const supplementText = 'Standard supplements';
                await db.saveReport({
                    sessionId: session.id,
                    clinicId: session.clinicId,
                    reportContent: fullReport,
                    symptoms: session.symptoms.join(', '),
                    severityScore: parseInt(session.assessmentAnswers[1]) || 0,
                    therapyCode: therapy.code,
                    therapyName: therapy.name,
                    supplements: supplementText
                });
            } catch (dbError) {
                console.log('DB report save error:', dbError);
            }
            
            return fullReport;
            
        case 'report_complete':
            return "Assessment complete. You can close this assessment window.";
            
        case 'terminated':
            return "Session terminated for safety. Please refer patient to their doctor.";
            
        default:
            return "Please continue with the assessment.";
    }
}

function selectBestTherapy(session) {
    let therapyScores = {};
    
    for (const [code, therapy] of Object.entries(THERAPIES)) {
        let score = 0;
        
        const primarySymptom = session.symptoms[0].toLowerCase();
        for (const keyword of therapy.keywords) {
            if (primarySymptom.includes(keyword)) {
                score += 30;
            }
        }
        
        for (let i = 1; i < session.symptoms.length; i++) {
            const symptom = session.symptoms[i].toLowerCase();
            for (const keyword of therapy.keywords) {
                if (symptom.includes(keyword)) {
                    score += 10;
                }
            }
        }
        
        therapyScores[code] = score;
    }
    
    let bestCode = '801';
    let highestScore = 0;
    
    for (const [code, score] of Object.entries(therapyScores)) {
        if (score > highestScore) {
            highestScore = score;
            bestCode = code;
        }
    }
    
    return {
        code: bestCode,
        name: THERAPIES[bestCode].name,
        score: highestScore
    };
}

function generateReport(session, therapy) {
    const date = new Date().toLocaleDateString('en-GB');
    
    return `
=====================================
CELLOXEN HEALTH ASSESSMENT REPORT
=====================================

PATIENT: ${session.patientName}
DATE: ${date}
SESSION ID: ${session.id}

CHIEF COMPLAINTS
----------------
Primary: ${session.symptoms[0]}
Duration: ${session.assessmentAnswers[0]}
Severity: ${session.assessmentAnswers[1]}/10

SYMPTOMS REPORTED
-----------------
${session.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}

RECOMMENDED THERAPY
-------------------
Code: ${therapy.code}
Name: ${therapy.name}

TREATMENT PROTOCOL
------------------
Duration: 40-45 minutes per session
Frequency: 2-3 sessions per week
Course Length: 8 weeks

=====================================
Assessment Complete
=====================================`;
}
