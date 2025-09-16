const auth = require('../../shared/auth');

module.exports = async function (context, req) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }

    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            context.res = {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: { success: false, message: 'Email and password are required' }
            };
            return;
        }

        // Attempt login
        const result = await auth.login(email, password);

        if (result.success) {
            context.res = {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*' 
                },
                body: {
                    success: true,
                    token: result.token,
                    user: result.user
                }
            };
        } else {
            context.res = {
                status: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: result.message
                }
            };
        }
    } catch (error) {
        context.log('Login error:', error);
        context.res = {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                message: 'Internal server error'
            }
        };
    }
};
