const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'celloxen-db.postgres.database.azure.com',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'adminuser',
    password: process.env.DB_PASSWORD || 'Kuwait1000$$',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

module.exports = async function (context, req) {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
        return;
    }

    try {
        const { email, password } = req.body;
        
        // For testing, accept Test123! for our known users
        if (password === 'Test123!' && 
            ['admin@celloxen.com', 'london@celloxen.com', 'admin2@celloxen.com'].includes(email)) {
            
            // Get user from database
            const result = await pool.query(
                'SELECT id, username, email, display_name, role, clinic_id FROM users WHERE email = $1',
                [email]
            );
            
            if (result.rows.length > 0) {
                const user = result.rows[0];
                
                // Create simple token
                const token = Buffer.from(JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    timestamp: Date.now()
                })).toString('base64');
                
                context.res = {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: {
                        success: true,
                        token: token,
                        user: {
                            id: user.id,
                            email: user.email,
                            displayName: user.display_name,
                            role: user.role,
                            clinicId: user.clinic_id
                        }
                    }
                };
                return;
            }
        }
        
        context.res = {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                message: 'Invalid credentials'
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                message: 'Login error: ' + error.message
            }
        };
    }
};
