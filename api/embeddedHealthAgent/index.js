// 1. Dependencies
const { v4: uuidv4 } = require('uuid');
const db = require('../shared/database');

// 2. System Instructions
const SYSTEM_INSTRUCTIONS = {
    persona: "You are 'Cello,' a clinical assistant program helping structure consultations. Never refer to yourself as AI, bot, or program. Use British English exclusively.",
    deflection: "I can only assist with questions related to this health assessment. Shall we continue?",
    formatting: "Always provide choices where appropriate, especially for yes/no questions."
};

// 3. Therapy Database
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

// 4. Complete Supplement Database
const SUPPLEMENT_PROTOCOLS = {
    '101': [ // Deep Sleep Renewal
        {
            name: 'Magnesium Glycinate',
            brand: 'Solgar, Nutri Advanced, Pure Encapsulations',
            dosage: '400mg',
            timing: '30 minutes before bed',
            duration: '8 weeks minimum',
            priority: 'essential'
        },
        {
            name: 'L-Theanine',
            brand: 'Solgar Theanine, NOW Foods, Jarrow Formulas',
            dosage: '200mg',
            timing: 'Evening',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Montmorency Cherry Extract',
            brand: 'CherryActive, Healthspan',
            dosage: '480mg',
            timing: 'Before bed',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Ashwagandha KSM-66',
            brand: 'Nutri Advanced, Viridian',
            dosage: '600mg',
            timing: 'Evening',
            duration: '8-12 weeks',
            priority: 'recommended'
        },
        {
            name: 'Valerian Root',
            brand: 'A.Vogel Dormeasan, Nytol Herbal',
            dosage: '450mg',
            timing: 'Before bed',
            duration: '4-8 weeks',
            priority: 'optional'
        }
    ],
    '102': [ // Stress Relief
        {
            name: 'Ashwagandha KSM-66',
            brand: 'Nutri Advanced, Viridian, Pukka',
            dosage: '600mg',
            timing: 'Morning',
            duration: '8-12 weeks',
            priority: 'essential'
        },
        {
            name: 'B-Complex',
            brand: 'Solgar B-Complex "100", BioCare B Complex',
            dosage: '1 capsule',
            timing: 'Morning with food',
            duration: 'Ongoing',
            priority: 'essential'
        },
        {
            name: 'Omega-3 EPA/DHA',
            brand: 'Nordic Naturals, Bare Biology',
            dosage: '2000mg',
            timing: 'With meals',
            duration: 'Ongoing',
            priority: 'recommended'
        },
        {
            name: 'Rhodiola Rosea',
            brand: 'Viridian, Solgar',
            dosage: '400mg',
            timing: 'Morning',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Vitamin D3',
            brand: 'Better You DLux, Nutri Advanced D3 Drops',
            dosage: '2000IU',
            timing: 'Morning',
            duration: 'Ongoing',
            priority: 'optional'
        }
    ],
    '103': [ // Relaxation & Calm
        {
            name: 'L-Theanine',
            brand: 'Solgar, NOW Foods, Jarrow',
            dosage: '200mg twice daily',
            timing: 'Morning and evening',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Passionflower',
            brand: 'A.Vogel Passiflora, Schwabe Pharma',
            dosage: '350mg',
            timing: 'Twice daily',
            duration: '6-8 weeks',
            priority: 'essential'
        },
        {
            name: 'Magnesium Taurate',
            brand: 'Cardiovascular Research, Douglas Labs',
            dosage: '400mg',
            timing: 'Evening',
            duration: 'Ongoing',
            priority: 'recommended'
        },
        {
            name: 'Lemon Balm',
            brand: 'A.Vogel, Viridian',
            dosage: '600mg',
            timing: 'Evening',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '104': [ // Sleep Quality
        {
            name: 'Glycine',
            brand: 'Solgar, Pure Encapsulations',
            dosage: '3g',
            timing: 'Before bed',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Magnesium Threonate',
            brand: 'Life Extension, NOW Foods',
            dosage: '2g',
            timing: 'Before bed',
            duration: 'Ongoing',
            priority: 'essential'
        },
        {
            name: 'L-Tryptophan',
            brand: 'Solgar, NOW Foods',
            dosage: '500mg',
            timing: 'Evening',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '201': [ // Kidney Vitality
        {
            name: 'N-Acetyl Cysteine (NAC)',
            brand: 'Solgar, NOW Foods',
            dosage: '600mg twice daily',
            timing: 'Morning and evening',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Alpha Lipoic Acid',
            brand: 'Solgar, Doctor\'s Best',
            dosage: '300mg',
            timing: 'With meals',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Cranberry Extract',
            brand: 'Nature\'s Way, Solgar',
            dosage: '500mg',
            timing: 'Daily',
            duration: 'Ongoing',
            priority: 'recommended'
        }
    ],
    '202': [ // Kidney Support
        {
            name: 'Astragalus',
            brand: 'Nature\'s Way, Solgar',
            dosage: '500mg twice daily',
            timing: 'Morning and evening',
            duration: '8-12 weeks',
            priority: 'essential'
        },
        {
            name: 'Coenzyme Q10',
            brand: 'Pharma Nord, Solgar',
            dosage: '200mg',
            timing: 'With meals',
            duration: '12 weeks',
            priority: 'essential'
        },
        {
            name: 'Milk Thistle',
            brand: 'A.Vogel, Solgar',
            dosage: '300mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '203': [ // Bladder Comfort
        {
            name: 'D-Mannose',
            brand: 'Sweet Cures, NOW Foods',
            dosage: '2g',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Pumpkin Seed Extract',
            brand: 'Solgar, Nature\'s Way',
            dosage: '500mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Quercetin',
            brand: 'Solgar, Jarrow',
            dosage: '500mg',
            timing: 'Twice daily',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '204': [ // Urinary Flow
        {
            name: 'Saw Palmetto',
            brand: 'A.Vogel Prostasan, Solgar',
            dosage: '320mg',
            timing: 'Daily',
            duration: '12 weeks',
            priority: 'essential'
        },
        {
            name: 'Beta-Sitosterol',
            brand: 'Nature\'s Way, Swanson',
            dosage: '130mg',
            timing: 'Daily',
            duration: '12 weeks',
            priority: 'essential'
        },
        {
            name: 'Zinc',
            brand: 'Solgar, BioCare',
            dosage: '15mg',
            timing: 'With meals',
            duration: 'Ongoing',
            priority: 'recommended'
        }
    ],
    '301': [ // Heart Health
        {
            name: 'CoQ10 Ubiquinol',
            brand: 'Pharma Nord BioActive Q10, Solgar Ubiquinol',
            dosage: '100mg twice daily',
            timing: 'With meals',
            duration: '12 weeks minimum',
            priority: 'essential'
        },
        {
            name: 'Hawthorn Berry',
            brand: 'A.Vogel Crataegus, Nature\'s Way',
            dosage: '500mg',
            timing: 'Twice daily',
            duration: '8-12 weeks',
            priority: 'essential'
        },
        {
            name: 'L-Carnitine',
            brand: 'Solgar, NOW Foods',
            dosage: '2000mg',
            timing: 'Morning',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Magnesium Citrate',
            brand: 'Solgar, Nutri Advanced',
            dosage: '400mg',
            timing: 'Evening',
            duration: 'Ongoing',
            priority: 'recommended'
        },
        {
            name: 'Vitamin K2 MK-7',
            brand: 'Nutri Advanced, Solgar',
            dosage: '100mcg',
            timing: 'With meals',
            duration: 'Ongoing',
            priority: 'optional'
        }
    ],
    '302': [ // Blood Pressure
        {
            name: 'Beetroot Extract',
            brand: 'Beet It Sport, Love Beets',
            dosage: '500mg',
            timing: 'Morning',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Aged Garlic Extract',
            brand: 'Kyolic, Quest Kyolic',
            dosage: '600mg',
            timing: 'Daily with meals',
            duration: '12 weeks',
            priority: 'essential'
        },
        {
            name: 'Olive Leaf Extract',
            brand: 'Comvita, Solgar',
            dosage: '500mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Hibiscus Extract',
            brand: 'Swanson, Nature\'s Way',
            dosage: '500mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'optional'
        }
    ],
    '303': [ // Circulation Boost
        {
            name: 'Ginkgo Biloba',
            brand: 'A.Vogel, Solgar',
            dosage: '120mg',
            timing: 'Twice daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Horse Chestnut',
            brand: 'A.Vogel Venaforce, Nature\'s Way',
            dosage: '300mg',
            timing: 'Twice daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Pine Bark Extract',
            brand: 'Solgar, Lamberts',
            dosage: '100mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '304': [ // Cardiovascular Vitality
        {
            name: 'L-Carnitine Tartrate',
            brand: 'MyProtein, NOW Foods',
            dosage: '2g',
            timing: 'Pre-exercise',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'D-Ribose',
            brand: 'Life Extension, NOW Foods',
            dosage: '5g',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Taurine',
            brand: 'Solgar, NOW Foods',
            dosage: '2g',
            timing: 'Daily',
            duration: 'Ongoing',
            priority: 'recommended'
        }
    ],
    '401': [ // Gout Relief
        {
            name: 'Montmorency Cherry Extract',
            brand: 'CherryActive, Healthspan',
            dosage: '480mg',
            timing: 'Daily',
            duration: '8 weeks minimum',
            priority: 'essential'
        },
        {
            name: 'Vitamin C',
            brand: 'Solgar Ester-C, BioCare',
            dosage: '500mg',
            timing: 'Daily',
            duration: 'Ongoing',
            priority: 'essential'
        },
        {
            name: 'Celery Seed Extract',
            brand: 'Nature\'s Way, Swanson',
            dosage: '150mg',
            timing: 'Twice daily',
            duration: '6-8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Nettle Leaf',
            brand: 'A.Vogel Urtica, Solgar',
            dosage: '300mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'optional'
        }
    ],
    '402': [ // ArthriComfort
        {
            name: 'Glucosamine Sulfate 2KCl',
            brand: 'Solgar, Seven Seas JointCare',
            dosage: '1500mg',
            timing: 'Daily with food',
            duration: '12 weeks minimum',
            priority: 'essential'
        },
        {
            name: 'Chondroitin Sulfate',
            brand: 'Solgar, Holland & Barrett',
            dosage: '1200mg',
            timing: 'Daily with glucosamine',
            duration: '12 weeks minimum',
            priority: 'essential'
        },
        {
            name: 'MSM',
            brand: 'Solgar, Doctor\'s Best',
            dosage: '2000mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Boswellia Serrata',
            brand: 'Solgar, Nutri Advanced',
            dosage: '400mg',
            timing: 'Twice daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Turmeric with Black Pepper',
            brand: 'Solgar Full Spectrum Curcumin',
            dosage: '500mg',
            timing: 'Twice daily with meals',
            duration: 'Ongoing',
            priority: 'optional'
        }
    ],
    '403': [ // Joint Mobility
        {
            name: 'Collagen Type II',
            brand: 'Solgar, NOW Foods',
            dosage: '40mg',
            timing: 'Daily',
            duration: '12 weeks',
            priority: 'essential'
        },
        {
            name: 'Hyaluronic Acid',
            brand: 'Solgar, Doctor\'s Best',
            dosage: '100mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Green-Lipped Mussel',
            brand: 'Healthspan, Nutri Advanced',
            dosage: '500mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '501': [ // Wound Healing
        {
            name: 'Vitamin C',
            brand: 'Solgar Ester-C, BioCare',
            dosage: '1000mg',
            timing: 'Twice daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Zinc',
            brand: 'Solgar, BioCare',
            dosage: '25mg',
            timing: 'Daily with food',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'L-Arginine',
            brand: 'Solgar, NOW Foods',
            dosage: '3g',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Grape Seed Extract',
            brand: 'Solgar, Viridian',
            dosage: '100mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'optional'
        }
    ],
    '502': [ // Vascular Health
        {
            name: 'Rutin',
            brand: 'Solgar, NOW Foods',
            dosage: '500mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Diosmin/Hesperidin',
            brand: 'Lamberts, Life Extension',
            dosage: '900mg/100mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Butcher\'s Broom',
            brand: 'Nature\'s Way, Swanson',
            dosage: '300mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '601': [ // Digestive Balance
        {
            name: 'Multi-Strain Probiotic',
            brand: 'Bio-Kult Advanced, Optibac',
            dosage: '14 billion CFU',
            timing: 'Morning before food',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Digestive Enzymes',
            brand: 'Solgar, NOW Super Enzymes',
            dosage: '1 capsule',
            timing: 'With meals',
            duration: 'As needed',
            priority: 'essential'
        },
        {
            name: 'L-Glutamine',
            brand: 'Solgar, Pure Encapsulations',
            dosage: '5g',
            timing: 'Empty stomach',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Slippery Elm',
            brand: 'Nature\'s Way, Solgar',
            dosage: '400mg',
            timing: 'Before meals',
            duration: '4-6 weeks',
            priority: 'optional'
        }
    ],
    '602': [ // Energy Boost
        {
            name: 'B12 Methylcobalamin',
            brand: 'Solgar, Better You B12',
            dosage: '1000mcg',
            timing: 'Morning sublingual',
            duration: 'Ongoing',
            priority: 'essential'
        },
        {
            name: 'Iron Bisglycinate',
            brand: 'Solgar Gentle Iron, Floradix',
            dosage: '25mg',
            timing: 'With vitamin C',
            duration: 'As per blood tests',
            priority: 'essential'
        },
        {
            name: 'Rhodiola Rosea',
            brand: 'Viridian, Solgar',
            dosage: '400mg',
            timing: 'Morning',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Acetyl-L-Carnitine',
            brand: 'Solgar, NOW Foods',
            dosage: '1000mg',
            timing: 'Morning',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '703': [ // Skin Health
        {
            name: 'Collagen Peptides',
            brand: 'Vital Proteins, Solgar',
            dosage: '10g',
            timing: 'Daily',
            duration: '12 weeks',
            priority: 'essential'
        },
        {
            name: 'Biotin',
            brand: 'Solgar, Holland & Barrett',
            dosage: '10mg',
            timing: 'Daily',
            duration: 'Ongoing',
            priority: 'essential'
        },
        {
            name: 'Evening Primrose Oil',
            brand: 'Efamol, Viridian',
            dosage: '1000mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Silica',
            brand: 'Solgar, BioSil',
            dosage: '10mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'optional'
        }
    ],
    '100': [ // Blood Sugar Balance
        {
            name: 'Chromium Picolinate',
            brand: 'Solgar, Holland & Barrett',
            dosage: '200mcg',
            timing: 'With meals',
            duration: '12 weeks',
            priority: 'essential'
        },
        {
            name: 'Alpha Lipoic Acid',
            brand: 'Solgar, Doctor\'s Best',
            dosage: '300mg',
            timing: 'Twice daily',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Cinnamon Extract',
            brand: 'Solgar, Nature\'s Way',
            dosage: '1000mg',
            timing: 'With meals',
            duration: 'Ongoing',
            priority: 'recommended'
        },
        {
            name: 'Gymnema Sylvestre',
            brand: 'Nature\'s Way, Swanson',
            dosage: '400mg',
            timing: 'Before meals',
            duration: '8 weeks',
            priority: 'recommended'
        }
    ],
    '801': [ // Total Wellness
        {
            name: 'Multivitamin/Mineral',
            brand: 'Nutri Advanced Multi Essentials, Solgar',
            dosage: '1 daily',
            timing: 'With breakfast',
            duration: 'Ongoing',
            priority: 'essential'
        },
        {
            name: 'Omega-3 EPA/DHA',
            brand: 'Nordic Naturals, Bare Biology',
            dosage: '2000mg',
            timing: 'With meals',
            duration: 'Ongoing',
            priority: 'essential'
        },
        {
            name: 'Milk Thistle Extract',
            brand: 'Solgar, A.Vogel',
            dosage: '300mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'NAC',
            brand: 'Solgar, NOW Foods',
            dosage: '600mg',
            timing: 'Daily',
            duration: '8 weeks',
            priority: 'recommended'
        },
        {
            name: 'Vitamin D3',
            brand: 'Better You, Nutri Advanced',
            dosage: '2000IU',
            timing: 'Morning',
            duration: 'Ongoing',
            priority: 'optional'
        }
    ],
    '802': [ // Stress & Relaxation Package
        {
            name: 'Phosphatidylserine',
            brand: 'Solgar, NOW Foods',
            dosage: '300mg',
            timing: 'Evening',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Lemon Balm',
            brand: 'A.Vogel, Viridian',
            dosage: '600mg',
            timing: 'Evening',
            duration: '8 weeks',
            priority: 'essential'
        },
        {
            name: 'Magnesium Complex',
            brand: 'Nutri Advanced, BioCare',
            dosage: '400mg',
            timing: 'Evening',
            duration: 'Ongoing',
            priority: 'recommended'
        }
    ]
};

// 5. Session management
const embeddedSessions = {};

// 6. Main module function
module.exports = async function (context, req) {
    const action = req.body?.action || 'chat';
    const sessionId = req.body?.sessionId || uuidv4();
    const message = (req.body?.message || '').trim();
    const clinicId = req.body?.clinicId;
    const patientId = req.body?.patientId;
    const patientName = req.body?.patientName;
    const useEnhanced = req.body?.useEnhanced !== false; // Default true
    
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
            phase: 'greeting',
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
    let response = {};
    
    if (action === 'start') {
        const startMessage = `Good morning Dr. ${session.practitionerName}. I'm Cello, your clinical assistant.
        
I'll be helping you conduct a comprehensive bioelectronic therapy assessment for ${session.patientName}.

Patient Information:
- Name: ${session.patientName}
- Age: ${session.patientAge} years
- Gender: ${session.patientGender}

Let's begin the assessment. Please confirm you're ready to proceed.`;
        
        response = formatResponse(
            cleanAIReferences(startMessage),
            ["Ready to begin", "Need a moment"]
        );
    } else {
        response = await processEnhancedConversation(session, message);
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

// 7. Helper Functions
function formatResponse(message, choices = null) {
    return {
        message: message,
        choices: choices || [],
        requiresInput: choices ? false : true
    };
}

function cleanAIReferences(text) {
    return text
        .replace(/\bAI\b/g, 'clinical assistant')
        .replace(/\bbot\b/g, 'assistant')
        .replace(/\bartificial intelligence\b/gi, 'clinical support system')
        .replace(/I am an AI/gi, 'I am Cello')
        .replace(/As an AI/gi, 'As a clinical assistant');
}

// 8. Enhanced conversation flow
async function processEnhancedConversation(session, message) {
    const patientName = session.patientName;
    const gender = session.patientGender;
    const practitionerName = session.practitionerName || 'Doctor';
    
    // Handle ready confirmation from start
    if (session.phase === 'greeting' && (message.toLowerCase().includes('ready') || message.toLowerCase().includes('begin'))) {
        session.phase = 'contraindications';
        
        const contraindicationsList = gender === 'Male' ? 
            `1. A pacemaker or any implanted electronic device
2. Active cancer treatment
3. Recent stroke or heart attack (within 6 weeks)` :
            `1. A pacemaker or any implanted electronic device
2. Pregnancy (especially first trimester)
3. Active cancer treatment
4. Recent stroke or heart attack (within 6 weeks)`;
        
        const contraindicationsMessage = `Dr. ${practitionerName}, I need to check for safety contraindications. 

Please ask ${patientName} if ${gender === 'Male' ? 'he' : 'she'} has any of the following:
${contraindicationsList}

Does ${patientName} have any of these conditions?`;
        
        return formatResponse(
            cleanAIReferences(contraindicationsMessage),
            ["Yes, one or more conditions present", "No, none of these conditions"]
        );
    }

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

            const greetingMessage = `Dr. ${practitionerName}, I need to check for safety contraindications. 

Please ask ${patientName} if ${gender === 'Male' ? 'he' : 'she'} has any of the following:
${contraindicationsList}

Does ${patientName} have any of these conditions?`;
            
            return formatResponse(
                cleanAIReferences(greetingMessage),
                ["Yes, one or more conditions present", "No, none of these conditions"]
            );
            
        case 'contraindications':
            if (message.toLowerCase().includes('yes')) {
                session.phase = 'contraindications_clearance';
                const clearanceMessage = `Important: The mentioned condition requires medical clearance. 

Does ${patientName} have written approval from their GP to proceed with bioelectronic therapy?`;
                return formatResponse(
                    cleanAIReferences(clearanceMessage),
                    ["Yes, has written clearance", "No, does not have clearance"]
                );
            }
            
            session.phase = 'primary_concern';
            const concernMessage = `Thank you for confirming. No contraindications noted.

Dr. ${practitionerName}, please ask ${patientName} to describe ${gender === 'Male' ? 'his' : 'her'} PRIMARY health concern or main symptom that brings them in today.`;
            return formatResponse(cleanAIReferences(concernMessage), null);
            
        case 'contraindications_clearance':
            if (!message.toLowerCase().includes('yes')) {
                session.phase = 'report_complete';
                const terminationMessage = `I'm sorry, but we cannot proceed with the assessment without proper medical clearance for the contraindication. 

Please have ${patientName} obtain written clearance from their GP before we can continue with bioelectronic therapy.

Assessment terminated for safety reasons.`;
                return formatResponse(cleanAIReferences(terminationMessage), null);
            }
            
            session.phase = 'primary_concern';
            const proceedMessage = `Medical clearance noted. We can proceed with caution.

Dr. ${practitionerName}, please ask ${patientName} to describe ${gender === 'Male' ? 'his' : 'her'} PRIMARY health concern or main symptom.`;
            return formatResponse(cleanAIReferences(proceedMessage), null);
            
        case 'primary_concern':
            session.primaryConcern = message;
            session.symptoms = [message];
            session.phase = 'severity';
            
            const severityMessage = `I understand ${patientName}'s primary concern is: "${message}"

Dr. ${practitionerName}, please ask ${patientName} to rate the severity of this condition on a scale of 1 to 10, where 1 is mild and 10 is severe.`;
            return formatResponse(
                cleanAIReferences(severityMessage),
                ["1-2 (Mild)", "3-4 (Moderate)", "5-6 (Significant)", "7-8 (Severe)", "9-10 (Very Severe)"]
            );
            
        case 'severity':
            let severityScore = 5;
            if (message.includes('1-2')) severityScore = 2;
            else if (message.includes('3-4')) severityScore = 4;
            else if (message.includes('5-6')) severityScore = 6;
            else if (message.includes('7-8')) severityScore = 8;
            else if (message.includes('9-10')) severityScore = 10;
            else severityScore = parseInt(message) || 5;

            session.severityScores = { primary: severityScore };
            session.phase = 'duration';
            
            const durationMessage = `Severity score of ${severityScore}/10 noted.

Please ask ${patientName} how long ${gender === 'Male' ? 'he has' : 'she has'} been experiencing this condition?`;
            return formatResponse(
                cleanAIReferences(durationMessage),
                ["Less than 1 week", "1-4 weeks", "1-3 months", "3-6 months", "6-12 months", "Over 1 year"]
            );
            
        case 'duration':
            session.duration = message;
            session.phase = 'related_symptoms';
            
            const relatedMessage = `Duration of ${message} recorded.

Dr. ${practitionerName}, are there any OTHER symptoms or related health issues ${patientName} is experiencing?`;
            return formatResponse(
                cleanAIReferences(relatedMessage),
                ["Yes, there are other symptoms", "No other symptoms"]
            );
            
        case 'related_symptoms':
            if (message.toLowerCase().includes('yes')) {
                session.phase = 'collect_related_symptoms';
                return formatResponse(
                    cleanAIReferences(`Please describe the additional symptoms ${patientName} is experiencing:`),
                    null
                );
            } else {
                session.phase = 'lifestyle';
                const lifestyleMessage = `No additional symptoms noted.

Now I need to understand ${patientName}'s lifestyle factors. How would you describe ${gender === 'Male' ? 'his' : 'her'} sleep quality?`;
                return formatResponse(
                    cleanAIReferences(lifestyleMessage),
                    ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
                );
            }
            
        case 'collect_related_symptoms':
            session.symptoms.push(message);
            session.phase = 'lifestyle';
            
            const lifestyleCollectMessage = `Additional symptoms noted: ${message}

Now I need to understand ${patientName}'s lifestyle factors. How would you describe ${gender === 'Male' ? 'his' : 'her'} sleep quality?`;
            return formatResponse(
                cleanAIReferences(lifestyleCollectMessage),
                ["Excellent", "Good", "Fair", "Poor", "Very Poor"]
            );
            
        case 'lifestyle':
            session.lifestyle = `Sleep quality: ${message}`;
            session.phase = 'stress_levels';
            
            const stressMessage = `Sleep quality recorded as ${message}.

How would you rate ${patientName}'s current stress levels?`;
            return formatResponse(
                cleanAIReferences(stressMessage),
                ["Very Low", "Low", "Moderate", "High", "Very High"]
            );
            
        case 'stress_levels':
            session.lifestyle += `, Stress levels: ${message}`;
            session.phase = 'digestive_health';
            
            const digestiveMessage = `Stress level recorded as ${message}.

Does ${patientName} experience any digestive issues?`;
            return formatResponse(
                cleanAIReferences(digestiveMessage),
                ["No digestive issues", "Occasional discomfort", "Frequent digestive problems", "Chronic digestive conditions"]
            );
            
        case 'digestive_health':
            session.lifestyle += `, Digestive health: ${message}`;
            session.phase = 'energy_levels';
            
            const energyMessage = `Digestive status noted.

How would you describe ${patientName}'s energy levels throughout the day?`;
            return formatResponse(
                cleanAIReferences(energyMessage),
                ["Consistently high", "Generally good", "Variable/fluctuating", "Generally low", "Extremely fatigued"]
            );
            
        case 'energy_levels':
            session.lifestyle += `, Energy: ${message}`;
            session.phase = 'medical_history';
            
            const historyMessage = `Energy levels recorded.

Finally, Dr. ${practitionerName}, does ${patientName} have any relevant medical history, current medications, or previous treatments we should be aware of?`;
            return formatResponse(
                cleanAIReferences(historyMessage),
                ["Yes, has relevant medical history", "No significant medical history"]
            );
            
        case 'medical_history':
            if (message.toLowerCase().includes('yes')) {
                session.phase = 'collect_medical_history';
                return formatResponse(
                    cleanAIReferences(`Please provide details of ${patientName}'s medical history, medications, and previous treatments:`),
                    null
                );
            } else {
                session.medicalHistory = 'No significant medical history reported';
                session.phase = 'report';
                return formatResponse(cleanAIReferences(generateEnhancedReport(session)), null);
            }
            
        case 'collect_medical_history':
            session.medicalHistory = message;
            session.phase = 'report';
            
            return formatResponse(cleanAIReferences(generateEnhancedReport(session)), null);
            
        case 'report':
            return formatResponse(cleanAIReferences("Assessment complete. The report has been saved and sent to your records."), null);
            
        default:
            return formatResponse(cleanAIReferences("Please continue with the assessment."), null);
    }
}

// 9. Fixed selectBestTherapy function
function selectBestTherapy(session) {
    const therapyScores = {};
    
    const WEIGHTS = {
        primaryConcern: 100,
        primaryKeywordBonus: 20,
        severityMultiplier: 2,
        relatedSymptoms: 30,
        durationChronic: 20,
        lifestyle: 15,
        medicalHistory: 25,
        comorbidity: 40
    };
    
    for (const [code, therapy] of Object.entries(THERAPIES)) {
        let score = 0;
        let matchedKeywords = [];
        
        const primaryLower = (session.primaryConcern || '').toLowerCase();
        let primaryMatches = 0;
        
        for (const keyword of therapy.keywords) {
            if (primaryLower.includes(keyword)) {
                score += WEIGHTS.primaryConcern;
                score += WEIGHTS.primaryKeywordBonus;
                primaryMatches++;
                matchedKeywords.push(keyword);
            }
        }
        
        if (primaryMatches > 0) {
            const severityFactor = (session.severityScores?.primary || 5) / 5;
            score *= (1 + (severityFactor * WEIGHTS.severityMultiplier));
        }
        
        if (session.duration) {
            const durationLower = session.duration.toLowerCase();
            if (durationLower.includes('month') || durationLower.includes('year') || durationLower.includes('over')) {
                if (primaryMatches > 0) {
                    score += WEIGHTS.durationChronic;
                }
            }
        }
        
        session.symptoms.forEach((symptom, index) => {
            if (index > 0 && symptom) {
                const symptomLower = symptom.toLowerCase();
                for (const keyword of therapy.keywords) {
                    if (symptomLower.includes(keyword)) {
                        score += WEIGHTS.relatedSymptoms;
                        matchedKeywords.push(keyword);
                    }
                }
            }
        });
        
        const lifestyleLower = (session.lifestyle || '').toLowerCase();
        for (const keyword of therapy.keywords) {
            if (lifestyleLower.includes(keyword)) {
                score += WEIGHTS.lifestyle;
                
                if (keyword.includes('sleep') && lifestyleLower.includes('poor')) {
                    score += WEIGHTS.lifestyle * 2;
                }
                
                if (keyword.includes('stress') && lifestyleLower.includes('high')) {
                    score += WEIGHTS.lifestyle * 2;
                }
            }
        }
        
        const historyLower = (session.medicalHistory || '').toLowerCase();
        for (const keyword of therapy.keywords) {
            if (historyLower.includes(keyword)) {
                score += WEIGHTS.medicalHistory;
            }
        }
        
        if (matchedKeywords.length >= 3) {
            score += WEIGHTS.comorbidity * (matchedKeywords.length - 2);
        }
        
        therapyScores[code] = {
            score: Math.round(score),
            matchedKeywords: [...new Set(matchedKeywords)],
            therapy: therapy
        };
    }
    
    const sortedTherapies = Object.entries(therapyScores)
        .sort(([,a], [,b]) => b.score - a.score)
        .slice(0, 3);
    
    console.log('Top therapy matches:', sortedTherapies.map(([code, data]) => ({
        code,
        score: data.score,
        keywords: data.matchedKeywords
    })));
    
    const topScore = sortedTherapies[0][1].score;
    const recommendedTherapies = [];
    
    recommendedTherapies.push({
        code: sortedTherapies[0][0],
        ...sortedTherapies[0][1].therapy,
        score: sortedTherapies[0][1].score,
        matchedKeywords: sortedTherapies[0][1].matchedKeywords,
        priority: 'primary'
    });
    
    if (sortedTherapies[1] && sortedTherapies[1][1].score >= topScore * 0.7) {
        recommendedTherapies.push({
            code: sortedTherapies[1][0],
            ...sortedTherapies[1][1].therapy,
            score: sortedTherapies[1][1].score,
            matchedKeywords: sortedTherapies[1][1].matchedKeywords,
            priority: 'secondary'
        });
    }
    
    if (sortedTherapies[2] && sortedTherapies[2][1].score >= topScore * 0.5) {
        recommendedTherapies.push({
            code: sortedTherapies[2][0],
            ...sortedTherapies[2][1].therapy,
            score: sortedTherapies[2][1].score,
            matchedKeywords: sortedTherapies[2][1].matchedKeywords,
            priority: 'adjunct'
        });
    }
    
    if (topScore < 50) {
        return [{
            code: '801',
            ...THERAPIES['801'],
            score: 0,
            matchedKeywords: [],
            priority: 'default'
        }];
    }
    
    return recommendedTherapies;
}

// 10. Fixed selectSupplements function
function selectSupplements(recommendedTherapies, session) {
    const selectedSupplements = [];
    const supplementMap = new Map();
    
    recommendedTherapies.forEach((therapy, index) => {
        const supplements = SUPPLEMENT_PROTOCOLS[therapy.code] || [];
        
        supplements.forEach(supplement => {
            const key = supplement.name.toLowerCase();
            
            if (supplementMap.has(key)) {
                return;
            }
            
            let include = false;
            
            if (index === 0) {
                include = supplement.priority === 'essential' || 
                         supplement.priority === 'recommended';
            } else if (index === 1) {
                include = supplement.priority === 'essential';
            } else {
                include = supplement.priority === 'essential' && selectedSupplements.length < 5;
            }
            
            if (include) {
                if (session.severityScores?.primary >= 7) {
                    include = true;
                }
                
                if (session.lifestyle) {
                    const lifestyle = session.lifestyle.toLowerCase();
                    
                    if (lifestyle.includes('poor') && lifestyle.includes('sleep')) {
                        if (supplement.name.includes('Magnesium') || 
                            supplement.name.includes('L-Theanine') ||
                            supplement.name.includes('Cherry')) {
                            include = true;
                        }
                    }
                    
                    if (lifestyle.includes('high') && lifestyle.includes('stress')) {
                        if (supplement.name.includes('Ashwagandha') || 
                            supplement.name.includes('B-Complex') ||
                            supplement.name.includes('Rhodiola')) {
                            include = true;
                        }
                    }
                    
                    if (lifestyle.includes('digestive')) {
                        if (supplement.name.includes('Probiotic') || 
                            supplement.name.includes('Glutamine') ||
                            supplement.name.includes('Digestive')) {
                            include = true;
                        }
                    }
                }
            }
            
            if (include && selectedSupplements.length < 5) {
                supplementMap.set(key, true);
                selectedSupplements.push({
                    ...supplement,
                    therapyCode: therapy.code,
                    therapyName: therapy.name,
                    reason: therapy.priority === 'primary' ? 
                            'Primary therapy support' : 
                            therapy.priority === 'secondary' ? 
                            'Secondary therapy support' : 
                            'Adjunct therapy support'
                });
            }
        });
    });
    
    if (selectedSupplements.length === 0) {
        selectedSupplements.push({
            name: 'Multivitamin/Mineral',
            brand: 'Nutri Advanced Multi Essentials, Solgar',
            dosage: '1 daily',
            timing: 'With breakfast',
            duration: 'Ongoing',
            priority: 'essential',
            reason: 'General wellness support'
        });
        
        selectedSupplements.push({
            name: 'Omega-3 EPA/DHA',
            brand: 'Nordic Naturals, Bare Biology',
            dosage: '1000mg',
            timing: 'With meals',
            duration: 'Ongoing',
            priority: 'recommended',
            reason: 'Anti-inflammatory support'
        });
    }
    
    return selectedSupplements;
}

// Continue in next message due to length limit...
