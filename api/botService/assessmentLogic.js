// Therapy protocols from your prescribing guide
const THERAPIES = {
  '101': { 
    name: 'Deep Sleep Renewal Therapy', 
    keywords: ['insomnia', 'sleep', 'awakening', 'nighttime', 'can\'t sleep'],
    duration: 45,
    frequency: '2-3 sessions per week',
    courseLength: '8 weeks minimum'
  },
  '102': { 
    name: 'Stress Relief Therapy', 
    keywords: ['stress', 'burnout', 'tension', 'overwhelm', 'pressure'],
    duration: 35,
    frequency: '1-2 sessions per week',
    courseLength: '8 weeks'
  },
  '103': { 
    name: 'Relaxation & Calm Therapy', 
    keywords: ['anxiety', 'nervous', 'restless', 'panic', 'worried'],
    duration: 40,
    frequency: '2 sessions per week',
    courseLength: '8 weeks'
  },
  '104': { 
    name: 'Sleep Quality Therapy', 
    keywords: ['fragmented', 'early wake', 'sleep quality', 'tired'],
    duration: 40,
    frequency: '2-3 sessions per week',
    courseLength: '6-8 weeks'
  },
  '201': { 
    name: 'Kidney Vitality Therapy', 
    keywords: ['kidney', 'fluid', 'oedema', 'retention', 'swelling'],
    duration: 40,
    frequency: '2 sessions weekly',
    courseLength: '8 weeks minimum'
  },
  '301': { 
    name: 'Heart Health Therapy', 
    keywords: ['heart', 'cardiac', 'coronary', 'arrhythmia', 'chest'],
    duration: 45,
    frequency: '2 sessions weekly',
    courseLength: '10-12 weeks'
  },
  '401': { 
    name: 'Gout Relief Therapy', 
    keywords: ['gout', 'uric acid', 'joint swelling', 'toe pain'],
    duration: 40,
    frequency: '2 sessions weekly',
    courseLength: '6-8 weeks'
  },
  '100': { 
    name: 'Blood Sugar Balance Therapy', 
    keywords: ['diabetes', 'blood sugar', 'insulin', 'glucose'],
    duration: 45,
    frequency: '3 sessions weekly initially',
    courseLength: '10-12 weeks'
  },
  '801': { 
    name: 'Total Wellness Package', 
    keywords: ['detox', 'wellness', 'general', 'prevention'],
    duration: 60,
    frequency: '1-2 sessions weekly',
    courseLength: '8-16 weeks'
  }
};

// Assessment phases
const PHASES = {
  GREETING: 'greeting',
  CONTRAINDICATIONS: 'contraindications',
  PRIMARY_CONCERN: 'primary_concern',
  SEVERITY: 'severity',
  DURATION: 'duration',
  RELATED_SYMPTOMS: 'related_symptoms',
  LIFESTYLE: 'lifestyle',
  MEDICAL_HISTORY: 'medical_history',
  ROOT_CAUSE: 'root_cause',
  REPORT: 'report'
};

function getNextQuestion(session, userResponse) {
  const patientName = session.patientName;
  const practitionerName = session.practitionerName;
  const gender = session.patientGender;
  
  switch(session.phase) {
    case PHASES.GREETING:
      session.phase = PHASES.CONTRAINDICATIONS;
      
      // Skip pregnancy question for males
      if (gender === 'Male') {
        return {
          message: `Dr. ${practitionerName}, I need to check for safety contraindications. 
          
Please ask ${patientName} if he has any of the following:
1. A pacemaker or any implanted electronic device
2. Active cancer treatment
3. Recent stroke or heart attack (within 6 weeks)

Does ${patientName} have any of these conditions?`,
          phase: PHASES.CONTRAINDICATIONS,
          isComplete: false
        };
      } else {
        return {
          message: `Dr. ${practitionerName}, I need to check for safety contraindications. 
          
Please ask ${patientName} if she has any of the following:
1. A pacemaker or any implanted electronic device
2. Pregnancy (especially first trimester)
3. Active cancer treatment
4. Recent stroke or heart attack (within 6 weeks)

Does ${patientName} have any of these conditions?`,
          phase: PHASES.CONTRAINDICATIONS,
          isComplete: false
        };
      }
      
    case PHASES.CONTRAINDICATIONS:
      if (userResponse.toLowerCase().includes('yes')) {
        return {
          message: `Important: The mentioned condition requires medical clearance. 
          
Does ${patientName} have written approval from their doctor to proceed with bioelectronic therapy?`,
          phase: PHASES.CONTRAINDICATIONS,
          isComplete: false
        };
      }
      
      session.phase = PHASES.PRIMARY_CONCERN;
      return {
        message: `Thank you for confirming. No contraindications noted.
        
Dr. ${practitionerName}, please ask ${patientName} to describe ${gender === 'Male' ? 'his' : 'her'} PRIMARY health concern or main symptom in detail. What brings ${gender === 'Male' ? 'him' : 'her'} here today?`,
        phase: PHASES.PRIMARY_CONCERN,
        isComplete: false
      };
      
    case PHASES.PRIMARY_CONCERN:
      session.primaryConcern = userResponse;
      session.symptoms.push(userResponse);
      session.phase = PHASES.SEVERITY;
      
      return {
        message: `I understand ${patientName}'s primary concern.
        
Dr. ${practitionerName}, please ask ${patientName} to rate the severity of this condition on a scale of 1 to 10, where 1 is mild and 10 is severe.`,
        phase: PHASES.SEVERITY,
        isComplete: false
      };
      
    case PHASES.SEVERITY:
      session.severityScores.primary = parseInt(userResponse) || 5;
      session.phase = PHASES.DURATION;
      
      return {
        message: `Severity score of ${session.severityScores.primary} noted.
        
Please ask ${patientName} how long ${gender === 'Male' ? 'he has' : 'she has'} been experiencing this condition? (e.g., 2 weeks, 3 months, 1 year)`,
        phase: PHASES.DURATION,
        isComplete: false
      };
      
    case PHASES.DURATION:
      session.duration = userResponse;
      session.phase = PHASES.RELATED_SYMPTOMS;
      
      return {
        message: `Duration of ${userResponse} recorded.
        
Dr. ${practitionerName}, please ask ${patientName} if there are any OTHER symptoms or related health issues ${gender === 'Male' ? 'he' : 'she'} is experiencing? This helps us understand the complete picture.`,
        phase: PHASES.RELATED_SYMPTOMS,
        isComplete: false
      };
      
    case PHASES.RELATED_SYMPTOMS:
      session.symptoms.push(userResponse);
      session.phase = PHASES.LIFESTYLE;
      
      return {
        message: `Additional symptoms noted.
        
Please ask ${patientName} about ${gender === 'Male' ? 'his' : 'her'} lifestyle:
- How is ${gender === 'Male' ? 'his' : 'her'} sleep quality?
- What are ${gender === 'Male' ? 'his' : 'her'} stress levels like?
- Any digestive issues or energy concerns?`,
        phase: PHASES.LIFESTYLE,
        isComplete: false
      };
      
    case PHASES.LIFESTYLE:
      session.lifestyle = userResponse;
      session.phase = PHASES.MEDICAL_HISTORY;
      
      return {
        message: `Lifestyle factors recorded.
        
Finally, Dr. ${practitionerName}, please ask ${patientName} about any relevant medical history, current medications, or previous treatments for this condition.`,
        phase: PHASES.MEDICAL_HISTORY,
        isComplete: false
      };
      
    case PHASES.MEDICAL_HISTORY:
      session.medicalHistory = userResponse;
      session.phase = PHASES.REPORT;
      
      // Generate comprehensive report
      const report = generateHolisticReport(session);
      
      return {
        message: report,
        phase: PHASES.REPORT,
        isComplete: true,
        report: report
      };
      
    default:
      return {
        message: "Assessment complete.",
        phase: PHASES.REPORT,
        isComplete: true
      };
  }
}

function generateHolisticReport(session) {
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
Date of Birth: ${session.patientDOB}
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
This bioelectronic therapy uses precisely calibrated magnetic fields to stimulate specific acupoints and meridians, addressing the root cause of the condition.

Prescribing Guidelines:
- Duration: ${therapy.duration} minutes per session
- Frequency: ${therapy.frequency}
- Course Length: ${therapy.courseLength}
- Total Sessions: Approximately ${calculateSessions(therapy)}

Anticipated Health Benefits:
Week 1-2: Initial symptom relief and improved comfort
Week 3-4: Progressive improvement in primary symptoms
Week 5-6: Stabilization and deeper healing
Week 7-8+: Sustained improvement and prevention

SUPPORTING SUPPLEMENTS
----------------------
Based on the therapy protocol, we recommend:

1. Primary Support: Targeted supplements for ${therapy.name}
2. Secondary Support: General wellness supplements
3. Lifestyle Support: Nutritional support for healing

(Specific supplement recommendations to be provided by practitioner based on individual needs)

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
  
  return report;
}

function selectBestTherapy(session) {
  let scores = {};
  
  // Analyze symptoms against therapy keywords
  for (const [code, therapy] of Object.entries(THERAPIES)) {
    let score = 0;
    const allText = (session.symptoms.join(' ') + ' ' + session.lifestyle).toLowerCase();
    
    for (const keyword of therapy.keywords) {
      if (allText.includes(keyword)) {
        score += 10;
      }
    }
    
    scores[code] = score;
  }
  
  // Find best match
  let bestCode = '801'; // Default to wellness package
  let highestScore = 0;
  
  for (const [code, score] of Object.entries(scores)) {
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
    return "an imbalance in the body's circadian rhythms and nervous system regulation, potentially linked to stress and lifestyle factors.";
  } else if (primarySymptom.includes('stress') || primarySymptom.includes('anxiety')) {
    return "dysregulation of the autonomic nervous system with potential impacts on multiple body systems including digestion and sleep.";
  } else if (primarySymptom.includes('pain') || primarySymptom.includes('joint')) {
    return "inflammatory processes combined with reduced circulation and potential metabolic imbalances.";
  } else {
    return "a systemic imbalance requiring a holistic approach to restore optimal function.";
  }
}

function calculateSessions(therapy) {
  // Parse frequency and course length to estimate total sessions
  if (therapy.frequency.includes('2-3') && therapy.courseLength.includes('8')) {
    return '16-24';
  } else if (therapy.frequency.includes('2') && therapy.courseLength.includes('8')) {
    return '16';
  } else {
    return '12-20';
  }
}

module.exports = { getNextQuestion, PHASES };
