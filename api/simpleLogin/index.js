const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    host: process.env.DB_HOST || 'celloxen-db.postgres.database.azure.com',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'adminuser',
    password: process.env.DB_PASSWORD || 'Kuwait1000$$',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'celloxen-secret-key-2024';

module.exports = async function (context, req) {
    context.log('SimpleLogin function triggered');
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'Email and password are required'
                }
            };
            return;
        }

        // Check in users table first (for super_admin)
        const userQuery = 'SELECT * FROM users WHERE email = $1 OR username = $1';
        const userResult = await pool.query(userQuery, [email]);
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            
            // Simple password check for test accounts
            if (password === 'Test123!') {
                const token = jwt.sign(
                    { 
                        id: user.id, 
                        email: user.email, 
                        role: user.role || user.user_type 
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                // For super_admin users
                const userData = {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name || 'Super Admin',
                    role: user.role || user.user_type || 'super_admin',
                    clinicId: null,
                    clinic_id: null
                };
                
                context.res = {
                    status: 200,
                    body: {
                        success: true,
                        token: token,
                        user: userData
                    }
                };
                return;
            }
        }
        
        // Check in clinics table for clinic users
        const clinicQuery = 'SELECT * FROM clinics WHERE email = $1 OR username = $1';
        const clinicResult = await pool.query(clinicQuery, [email]);
        
        if (clinicResult.rows.length > 0) {
            const clinic = clinicResult.rows[0];
            
            // Simple password check for test accounts
            if (password === 'Test123!') {
                const token = jwt.sign(
                    { 
                        id: clinic.id, 
                        email: clinic.email, 
                        role: 'clinic' 
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                // For clinic users - PROPERLY SET clinic_id
                const userData = {
                    id: clinic.id,  // This is the clinic's ID
                    email: clinic.email,
                    displayName: clinic.clinic_name || clinic.owner_name || 'Clinic',
                    clinicName: clinic.clinic_name,
                    role: 'clinic',
                    clinicId: clinic.id,  // Add clinicId
                    clinic_id: clinic.id  // Add clinic_id (both formats for compatibility)
                };
                
                context.res = {
                    status: 200,
                    body: {
                        success: true,
                        token: token,
                        user: userData
                    }
                };
                return;
            }
        }
        
        // No user found or password incorrect
        context.res = {
            status: 401,
            body: {
                success: false,
                message: 'Invalid credentials'
            }
        };
        
    } catch (error) {
        context.log.error('Login error:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Login failed',
                error: error.message
            }
        };
    }
};
