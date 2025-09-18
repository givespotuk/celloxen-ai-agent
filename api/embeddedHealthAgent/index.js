const { v4: uuidv4 } = require('uuid');
const db = require('../shared/database');

// Therapy protocols with full details from prescribing guide
const THERAPIES = {
  '101': { 
    name: 'Deep Sleep Renewal Therapy', 
    keywords: ['insomnia', 'sleep', 'awakening', 'nighttime', 'can\'t sleep'],
    duration: 45,
    frequency: '2-3 sessions per week',
    courseLength: '8 weeks minimum',
    totalSessions: '16-24 sessions'
  },
  '102': { 
    name: 'Stress Relief Therapy', 
    keywords: ['stress', 'burnout', 'tension', 'overwhelm', 'pressure'],
    duration: 35,
    frequency: '1-2 sessions per week',
    courseLength: '8 weeks',
    totalSessions: '8-16 sessions'
  },
  '103': { 
    name: 'Relaxation & Calm Therapy', 
    keywords: ['anxiety', 'nervous', 'restless', 'panic', 'worried'],
    duration: 40,
    frequency: '2 sessions per week',
    courseLength: '8 weeks',
    totalSessions: '16 sessions'
  },
  '104': { 
    name: 'Sleep Quality Therapy', 
    keywords: ['fragmented', 'early wake', 'sleep quality', 'tired'],
    duration: 40,
    frequency: '2-3 sessions per week',
    courseLength: '6-8 weeks',
    totalSessions: '12-24 sessions'
  },
  '201': { 
    name: 'Kidney Vitality Therapy', 
    keywords: ['kidney', 'fluid', 'oedema', 'retention', 'swelling'],
    duration: 40,
    frequency: '2 sessions weekly',
    courseLength: '8 weeks minimum',
    totalSessions: '16 sessions'
  },
  '202': { 
    name: 'Kidney Support Therapy', 
    keywords: ['proteinuria', 'kidney function', 'renal'],
    duration: 40,
    frequency: '2-3 sessions weekly',
    courseLength: '8 weeks',
    totalSessions: '16-24 sessions'
  },
  '203': { 
    name: 'Bladder Comfort Therapy', 
    keywords: ['bladder', 'urgency', 'frequency', 'urinary', 'urination'],
    duration: 35,
    frequency: '2 sessions weekly',
    courseLength: '6-8 weeks',
    totalSessions: '12-16 sessions'
  },
  '204': { 
    name: 'Urinary Flow Therapy', 
    keywords: ['weak stream', 'prostate', 'BPH', 'hesitancy', 'dribbling'],
    duration: 40,
    frequency: '2-3 sessions weekly',
    courseLength: '8-10 weeks',
    totalSessions: '16-30 sessions'
  },
  '301': { 
    name: 'Heart Health Therapy', 
    keywords: ['heart', 'cardiac', 'coronary', 'arrhythmia', 'chest'],
    duration: 45,
    frequency: '2 sessions weekly',
    courseLength: '10-12 weeks',
    totalSessions: '20-24 sessions'
  },
  '302': { 
    name: 'Blood Pressure Balance Therapy', 
    keywords: ['hypertension', 'blood pressure', 'BP', 'high pressure'],
    duration: 40,
    frequency: '3 sessions weekly initially, then 2',
    courseLength: '10 weeks',
    totalSessions: '25-30 sessions'
  },
  '303': { 
    name: 'Circulation Boost Therapy', 
    keywords: ['circulation', 'cold hands', 'numbness', 'tingling'],
    duration: 35,
    frequency: '2-3 sessions weekly',
    courseLength: '8 weeks',
    totalSessions: '16-24 sessions'
  },
  '304': { 
    name: 'Cardiovascular Vitality Therapy', 
    keywords: ['endurance', 'athletic', 'metabolic', 'performance'],
    duration: 40,
    frequency: '2 sessions weekly',
    courseLength: '8 weeks',
    totalSessions: '16 sessions'
  },
  '401': { 
    name: 'Gout Relief Therapy', 
    keywords: ['gout', 'uric acid', 'joint swelling', 'toe pain'],
    duration: 40,
    frequency: 'Daily for acute (3-5 days), then 2 weekly',
    courseLength: '6-8 weeks',
    totalSessions: '15-20 sessions'
  },
  '402': { 
    name: 'ArthriComfort Therapy', 
    keywords: ['arthritis', 'joint pain', 'stiffness', 'morning stiff'],
    duration: 40,
    frequency: '2-3 sessions weekly',
    courseLength: '6 weeks minimum',
    totalSessions: '12-18 sessions'
  },
  '403': { 
    name: 'Joint Mobility Therapy', 
    keywords: ['mobility', 'flexibility', 'range motion', 'movement'],
    duration: 45,
    frequency: '3 sessions weekly for rehab, 2 for maintenance',
    courseLength: '8-12 weeks',
    totalSessions: '24-36 sessions'
  },
  '501': { 
    name: 'Wound Healing Therapy', 
    keywords: ['wound', 'ulcer', 'healing', 'sore', 'cut'],
    duration: 45,
    frequency: '3-4 sessions weekly',
    courseLength: '12 weeks or until healed',
    totalSessions: '36-48 sessions'
  },
  '502': { 
    name: 'Vascular Health Therapy', 
    keywords: ['vascular', 'vein', 'lymph', 'atherosclerosis'],
    duration: 40,
    frequency: '2-3 sessions weekly',
    courseLength: '10-12 weeks',
    totalSessions: '20-36 sessions'
  },
  '601': { 
    name: 'Digestive Balance Therapy', 
    keywords: ['IBS', 'constipation', 'bloating', 'digestive', 'stomach'],
    duration: 40,
    frequency: '2 sessions weekly',
    courseLength: '8 weeks',
    totalSessions: '16 sessions'
  },
  '602': { 
    name: 'Energy Boost Therapy', 
    keywords: ['fatigue', 'tired', 'energy', 'exhaustion', 'weak'],
    duration: 40,
    frequency: '2-3 sessions weekly',
    courseLength: '8 weeks',
    totalSessions: '16-24 sessions'
  },
  '703': { 
    name: 'Skin Health Therapy', 
    keywords: ['skin', 'eczema', 'psoriasis', 'dermatitis', 'rash'],
    duration: 40,
    frequency: '2 sessions weekly',
    courseLength: '8 weeks',
    totalSessions: '16 sessions'
  },
  '100': { 
    name: 'Blood Sugar Balance Therapy', 
    keywords: ['diabetes', 'blood sugar', 'insulin', 'glucose'],
    duration: 45,
    frequency: '3 sessions weekly initially, then 2',
    courseLength: '10-12 weeks',
    totalSessions: '25-36 sessions'
  },
  '801': { 
    name: 'Total Wellness Package (Detoxification)', 
    keywords: ['detox', 'wellness', 'general', 'prevention'],
    duration: 60,
    frequency: '1-2 sessions weekly',
    courseLength: '8-16 weeks',
    totalSessions: '8-32 sessions'
  },
  '802': { 
    name: 'Stress & Relaxation Package', 
    keywords: ['comprehensive', 'multiple', 'overall'],
    duration: 50,
    frequency: '1-2 sessions weekly',
    courseLength: '8-12 weeks',
    totalSessions: '8-24 sessions'
  }
};

const SYSTEM_INSTRUCTIONS = {
    persona: "You are 'Cello,' a clinical assistant program helping structure consultations. Never refer to yourself as AI, bot, or program. Use British English exclusively.",
    deflection: "I can only assist with questions related to this health assessment. Shall we continue?",
    formatting: "Always provide choices where appropriate, especially for yes/no questions."
};

function formatResponse(message, choices = null) {
    return {
        message: message,
        choices: choices || [],
        requiresInput: choices ? false : true
    };
}

const embeddedSessions = {};

module.exports = async function (context, req) {
    const action = req.body?.action || 'chat';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = (req.body?.message || '').trim();
    const clinicId = req.body?.clinicId;
    const patientId = req.body?.patientId;
    const patientName = req.body?.patientName;
    const useEnhanced = req.body?.useEnhanced || true; // Use enhanced by default
    
    // Initialize session
    if (!embeddedSessions[sessionId]) {
        let patientData = { 
            name: patientName || 'Patient',
            gender: 'Not specified',
            age: 'Unknown',
            dob: '1980-01-01'
        };
        
        // Try to get patient details from database
        if (patientId) {
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
                
                const result = await pool.query(
                    'SELECT full_name, first_name, last_name, date_of_birth, gender FROM patients WHERE patient_id = $1',
                    [patientId]
                );
                
                if (result.rows.length > 0) {
                    const patient = result.rows[0];
                    patientData.name = patient.full_name || `${patient.first_name} ${patient.last_name}`;
                    patientData.dob = patient.date_of_birth || '1980-01-01';
                    patientData.gender = patient.gender || 'Not specified';
                    patientData.age = calculateAge(patient.date_of_birth);
                }
                
                await pool.end();
            } catch (dbError) {
                context.log('DB error getting patient:', dbError);
            }
        }
        
        embeddedSessions[sessionId] = {
            id: sessionId,
            phase: useEnhanced ? 'greeting' : 'ready_check',
            clinicId: clinicId,
            patientId: patientId,
            patientName: patientData.name,
            patientGender: patientData.gender,
            patientAge: patientData.age,
            patientDOB: patientData.dob,
            practitionerName: 'Doctor',
            symptoms: [],
            severityScores: {},
            assessmentAnswers: [],
            responses: [],
            primaryConcern: '',
            duration: '',
            lifestyle: '',
            medicalHistory: '',
            useEnhanced: useEnhanced
        };
        
        // Save session
        try {
            await db.saveSession({
                sessionId: sessionId,
                clinicId: clinicId,
                practitionerName: 'Clinic Staff',
                patientName: patientData.name,
                patientDob: patientData.dob,
                patientGender: patientData.gender
            });
        } catch (dbError) {
            context.log('DB save session error:', dbError);
        }
    }
    
    const session = embeddedSessions[sessionId];
    let response = '';
    
    if (action === 'start') {
        if (session.useEnhanced) {
            response = `Good morning Dr. ${session.practitionerName}. I'm Cello, your holistic health assessment assistant.
            
I'll be helping you conduct a comprehensive bioelectronic therapy assessment for ${session.patientName}.

Patient Information:
- Name: ${session.patientName}
- Age: ${session.patientAge} years
- Gender: ${session.patientGender}

Let's begin the assessment. Please confirm you're ready to proceed.`;
        } else {
            response = `Starting assessment for ${session.patientName}.\n\nReady to begin the health assessment? Type 'yes' to continue.`;
        }
    } else {
        if (session.useEnhanced) {
            response = await processEnhancedConversation(session, message);
        } else {
            response = await processBasicConversation(session, message);
        }
    }
    
    // Save messages
    try {
        await db.saveMessage(sessionId, 'user', message, session.phase);
        await db.saveMessage(sessionId, 'assistant', response.message || response, session.phase);
    } catch (dbError) {
        context.log('DB message save error:', dbError);
    }
    
    // Update patient when complete
    if ((session.phase === 'report_complete' || session.phase === 'report') && patientId) {
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
            context.log('Error updating patient:', err);
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
            message: response.message || response,
            choices: response.choices || [],
            phase: session.phase,
            isComplete: session.phase === 'report_complete' || session.phase === 'report',
            requiresInput: response.requiresInput !== false
        }
    };
};

async function processEnhancedConversation(session, message) {
    const patientName = session.patientName;
    const gender = session.patientGender;
    const practitionerName = session.practitionerName || 'Doctor';

    switch(session.phase) {
        case 'greeting':
            session.phase = 'contraindications';
            
            const contraindicationsList = gender === 'Male' ? 
                `1. A pacemaker or any implanted electronic device\n2. Active cancer treatment\n3. Recent stroke or heart attack (within 6 weeks)` :
                `1. A pacemaker or any implanted electronic device\n2. Pregnancy (especially first trimester)\n3. Active cancer treatment\n4. Recent stroke or heart attack (within 6 weeks)`;

            return formatResponse(
                `Dr. ${practitionerName}, I need to check for safety contraindications. \nPlease ask ${patientName} if ${gender === 'Male' ? 'he' : 'she'} has any of the following:\n${contraindicationsList}\n\nDoes ${patientName} have any of these conditions?`,
                ["Yes, one or more conditions present", "No, none of these conditions"]
            );
            
        case 'contraindications':
            if (message.toLowerCase().includes('yes')) {
                session.phase = 'contraindications_clearance';
                return formatResponse(
                    `Important: The mentioned condition requires medical clearance. \nDoes ${patientName} have written approval from their GP to proceed with bioelectronic therapy?`,
                    ["Yes, has written clearance", "No, does not have clearance"]
                );
            }
            
            session.phase = 'primary_concern';
            return formatResponse(
                `Thank you for confirming. No contraindications noted.\nDr. ${practitionerName}, please ask ${patientName} to describe ${gender === 'Male' ? 'his' : 'her'} PRIMARY health concern or main symptom that brings them in today.`,
                null // No choices for open-ended question
            );
            
        case 'contraindications_clearance':
            if (!message.toLowerCase().includes('yes')) {
                session.phase = 'report_complete';
                return formatResponse(
                    `I'm sorry, but we cannot proceed with the assessment without proper medical clearance for the contraindication. \nPlease have ${patientName} obtain written clearance from their GP before we can continue with bioelectronic therapy.\nAssessment terminated for safety reasons.`,
                    null
                );
            }
            
            session.phase = 'primary_concern';
            return formatResponse(
                `Medical clearance noted. We can proceed with caution.\nDr. ${practitionerName}, please ask ${patientName} to describe ${gender === 'Male' ? 'his' : 'her'} PRIMARY health concern or main symptom.`,
                null
            );
            
        case 'primary_concern':
            session.primaryConcern = message;
            session.symptoms = [message]; // Reset symptoms array with primary concern
            session.phase = 'severity';
            
            return formatResponse(
                `I understand ${patientName}'s primary concern is: "${message}"\nDr. ${practitionerName}, please ask ${patientName} to rate the severity of this condition on a scale of 1 to 10, where 1 is mild and 10 is severe.`,
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
                `Severity score of ${severityScore}/10 noted.\nPlease ask ${patientName} how long ${gender === 'Male' ? 'he has' : 'she has'} been experiencing this condition?`,
                ["Less than 1 week", "1-4 weeks", "1-3 months", "3-6 months", "6-12 months", "Over 1 year"]
            );
            
        case 'duration':
            session.duration = message;
            session.phase = 'related_symptoms';
            
            return formatResponse(
                `Duration of ${message} recorded.\nDr. ${practitionerName}, are there any OTHER symptoms or related health issues ${patientName} is experiencing?`,
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
                    `No additional symptoms noted.\nNow I need to understand ${patientName}'s lifestyle factors. How would you describe ${gender === 'Male' ? 'his' : 'her'} sleep quality?`,
                    ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
                );
            }
            
        case 'collect_related_symptoms':
            session.symptoms.push(message);
            session.phase = 'lifestyle';
            
            return formatResponse(
                `Additional symptoms noted: ${message}\nNow I need to understand ${patientName}'s lifestyle factors. How would you describe ${gender === 'Male' ? 'his' : 'her'} sleep quality?`,
                ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
            );
            
        case 'lifestyle':
            session.lifestyle = `Sleep quality: ${message}`;
            session.phase = 'stress_levels';
            
            return formatResponse(
                `Sleep quality recorded as ${message}.\nHow would you rate ${patientName}'s current stress levels?`,
                ["Very Low", "Low", "Moderate", "High", "Very High"]
            );
            
        case 'stress_levels':
            session.lifestyle += `, Stress levels: ${message}`;
            session.phase = 'digestive_health';
            
            return formatResponse(
                `Stress level recorded as ${message}.\nDoes ${patientName} experience any digestive issues?`,
                ["No digestive issues", "Occasional discomfort", "Frequent digestive problems", "Chronic digestive conditions"]
            );
            
        case 'digestive_health':
            session.lifestyle += `, Digestive health: ${message}`;
            session.phase = 'energy_levels';
            
            return formatResponse(
                `Digestive status noted.\nHow would you describe ${patientName}'s energy levels throughout the day?`,
                ["Consistently high", "Generally good", "Variable/fluctuating", "Generally low", "Extremely fatigued"]
            );
            
        case 'energy_levels':
            session.lifestyle += `, Energy: ${message}`;
            session.phase = 'medical_history';
            
            return formatResponse(
                `Energy levels recorded.\nFinally, Dr. ${practitionerName}, does ${patientName} have any relevant medical history, current medications, or previous treatments we should be aware of?`,
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

// Basic conversation flow (original)
async function processBasicConversation(session, message) {
    const lower = message.toLowerCase();
    
    switch(session.phase) {
        case 'ready_check':
            if (lower.includes('yes') || lower.includes('ready')) {
                session.phase = 'contra_pacemaker';
                return "I need to check for safety contraindications.\n\n1. Does the patient have a pacemaker or any implanted electronic device?";
            }
            return "Type 'yes' when ready to begin the assessment.";
            
        // ... (rest of original flow)
        
        case 'assess_diabetes':
            session.symptoms.push(message);
            
            const therapy = selectBestTherapy(session);
            session.recommendedTherapy = therapy;
            session.phase = 'report_complete';
            
            const fullReport = generateBasicReport(session, therapy);
            
            // Save report
            try {
                await db.saveReport({
                    sessionId: session.id,
                    clinicId: session.clinicId,
                    reportContent: fullReport,
                    symptoms: session.symptoms.join(', '),
                    severityScore: parseInt(session.assessmentAnswers[1]) || 0,
                    therapyCode: therapy.code,
                    therapyName: therapy.name,
                    supplements: 'Standard supplements'
                });
            } catch (dbError) {
                context.log('DB report save error:', dbError);
            }
            
            return fullReport;
            
        default:
            return "Please continue with the assessment.";
    }
}

function generateEnhancedReport(session) {
    const therapy = selectBestTherapy(session);
    const date = new Date().toLocaleDateString('en-GB');
    
    const report = `
CELLOXEN HOLISTIC HEALTH ASSESSMENT REPORT
============================================

PATIENT INFORMATION
-------------------
Name: ${session.patientName}
Age: ${session.patientAge} years
Gender: ${session.patientGender}
Assessment Date: ${date}
Practitioner: Dr. ${session.practitionerName}

PATIENT HEALTH OVERVIEW
------------------------
Primary Complaint: ${session.primaryConcern}
Duration: ${session.duration}
Severity Score: ${session.severityScores.primary}/10

SYMPTOM ANALYSIS
----------------
${session.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}

LIFESTYLE FACTORS
-----------------
${session.lifestyle}

MEDICAL HISTORY
---------------
${session.medicalHistory}

HOLISTIC ROOT CAUSE ANALYSIS
-----------------------------
Based on the comprehensive assessment, the pattern of symptoms suggests ${getHolisticAnalysis(session)}

RECOMMENDED THERAPY PROTOCOL
-----------------------------
Therapy Code: ${therapy.code}
Therapy Name: ${therapy.name}

Therapy Overview:
This bioelectronic therapy uses precisely calibrated magnetic fields to stimulate specific acupoints and meridians.

Prescribing Guidelines:
- Duration: ${therapy.duration} minutes per session
- Frequency: ${therapy.frequency}
- Course Length: ${therapy.courseLength}
- Total Sessions: ${therapy.totalSessions}

Anticipated Health Benefits:
Week 1-2: Initial symptom relief and improved comfort
Week 3-4: Progressive improvement in primary symptoms
Week 5-6: Stabilization and deeper healing
Week 7-8+: Sustained improvement and prevention

SUPPORTING SUPPLEMENTS
----------------------
Based on the ${therapy.name} protocol, consider:
1. Primary Support: Targeted supplements for this therapy
2. Secondary Support: General wellness supplements
3. Lifestyle Support: Nutritional support for healing

IMPORTANT CONSIDERATIONS
------------------------
- This therapy complements but does not replace conventional medical care
- Regular monitoring of progress is recommended
- Lifestyle modifications will enhance treatment effectiveness
- Follow-up assessment recommended after 4 weeks

============================================
Report generated by Cello AI Assistant
Celloxen Health Platform
`;
    
    // Save report
    saveReportToDB(session, therapy, report);
    
    return report;
}

function generateBasicReport(session, therapy) {
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
Duration: ${therapy.duration || 40} minutes per session
Frequency: ${therapy.frequency || '2-3 sessions per week'}
Course Length: ${therapy.courseLength || '8 weeks'}

=====================================
Assessment Complete
=====================================`;
}

async function saveReportToDB(session, therapy, reportContent) {
    try {
        await db.saveReport({
            sessionId: session.id,
            clinicId: session.clinicId,
            reportContent: reportContent,
            symptoms: session.symptoms.join(', '),
            severityScore: session.severityScores.primary || 5,
            therapyCode: therapy.code,
            therapyName: therapy.name,
            supplements: 'Personalized recommendations pending'
        });
    } catch (error) {
        console.log('Error saving report:', error);
    }
}

function selectBestTherapy(session) {
    let therapyScores = {};
    
    for (const [code, therapy] of Object.entries(THERAPIES)) {
        let score = 0;
        const allText = session.symptoms.join(' ').toLowerCase();
        
        for (const keyword of therapy.keywords) {
            if (allText.includes(keyword)) {
                score += 10;
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
        ...THERAPIES[bestCode]
    };
}

function getHolisticAnalysis(session) {
    const primarySymptom = session.primaryConcern.toLowerCase();
    
    if (primarySymptom.includes('sleep') || primarySymptom.includes('insomnia')) {
        return "an imbalance in the body's circadian rhythms and nervous system regulation.";
    } else if (primarySymptom.includes('stress') || primarySymptom.includes('anxiety')) {
        return "dysregulation of the autonomic nervous system with impacts on multiple body systems.";
    } else if (primarySymptom.includes('pain') || primarySymptom.includes('joint')) {
        return "inflammatory processes combined with reduced circulation.";
    } else {
        return "a systemic imbalance requiring holistic support.";
    }
}

function calculateAge(dob) {
    if (!dob) return 'Unknown';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
