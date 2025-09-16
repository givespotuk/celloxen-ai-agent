const auth = require('../../shared/auth');
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
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            context.res = {
                status: 400,
                body: { success: false, message: 'Email and password required' }
            };
            return;
        }

        // Hash the new password
        const passwordHash = await auth.hashPassword(newPassword);

        // Update the user's password
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, username, email',
            [passwordHash, email]
        );

        if (result.rows.length === 0) {
            context.res = {
                status: 404,
                body: { success: false, message: 'User not found' }
            };
            return;
        }

        context.res = {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                message: 'Password updated successfully',
                user: result.rows[0]
            }
        };
    } catch (error) {
        context.log('Setup password error:', error);
        context.res = {
            status: 500,
            body: { success: false, message: 'Failed to update password' }
        };
    }
};
