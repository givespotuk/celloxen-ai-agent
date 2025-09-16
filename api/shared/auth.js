const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'celloxen-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

// Use the same pool configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'celloxen-db.postgres.database.azure.com',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'adminuser',
    password: process.env.DB_PASSWORD || 'Kuwait1000$$',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

module.exports = {
    // Hash password
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    },

    // Verify password
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    },

    // Generate JWT token
    generateToken(userId, role, clinicId = null) {
        return jwt.sign(
            { 
                userId, 
                role, 
                clinicId,
                timestamp: Date.now()
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );
    },

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    },

    // Login function
    async login(email, password) {
        try {
            // Check users table
            const userQuery = `
                SELECT u.*, c.clinic_name 
                FROM users u
                LEFT JOIN clinics c ON u.clinic_id = c.id
                WHERE u.email = $1 AND u.is_active = true
            `;
            
            const userResult = await pool.query(userQuery, [email]);
            
            if (userResult.rows.length === 0) {
                return { success: false, message: 'Invalid credentials' };
            }
            
            const user = userResult.rows[0];
            
            // Verify password
            const isValid = await this.verifyPassword(password, user.password_hash);
            
            if (!isValid) {
                // Update failed login attempts
                await pool.query(
                    'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = $1',
                    [user.id]
                );
                return { success: false, message: 'Invalid credentials' };
            }
            
            // Update last login
            await pool.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_attempts = 0 WHERE id = $1',
                [user.id]
            );
            
            // Generate token
            const token = this.generateToken(user.id, user.role, user.clinic_id);
            
            // Log the login
            await this.logAction(user.id, 'LOGIN', 'user', user.id, { email });
            
            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                    role: user.role,
                    clinicId: user.clinic_id,
                    clinicName: user.clinic_name
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed' };
        }
    },

    // Register new clinic
    async registerClinic(clinicData) {
        try {
            // Check if email already exists
            const existingClinic = await pool.query(
                'SELECT id FROM clinics WHERE email = $1',
                [clinicData.email]
            );
            
            if (existingClinic.rows.length > 0) {
                return { success: false, message: 'Email already registered' };
            }
            
            // Hash password
            const passwordHash = await this.hashPassword(clinicData.password);
            
            // Insert clinic
            const clinicQuery = `
                INSERT INTO clinics (
                    clinic_name, email, password_hash, 
                    owner_name, phone, address
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, clinic_name
            `;
            
            const clinicResult = await pool.query(clinicQuery, [
                clinicData.clinicName,
                clinicData.email,
                passwordHash,
                clinicData.ownerName,
                clinicData.phone,
                clinicData.address
            ]);
            
            const clinic = clinicResult.rows[0];
            
            // Create user account for clinic
            const userQuery = `
                INSERT INTO users (
                    username, email, password_hash, 
                    user_type, role, display_name, clinic_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            
            const userResult = await pool.query(userQuery, [
                clinicData.email.split('@')[0], // Username from email
                clinicData.email,
                passwordHash,
                'clinic',
                'clinic',
                clinicData.clinicName,
                clinic.id
            ]);
            
            return {
                success: true,
                clinicId: clinic.id,
                userId: userResult.rows[0].id
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed' };
        }
    },

    // Verify request authentication
    async authenticateRequest(req) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return { authenticated: false };
            }
            
            const decoded = this.verifyToken(token);
            
            if (!decoded) {
                return { authenticated: false };
            }
            
            // Get user details
            const userResult = await pool.query(
                'SELECT * FROM users WHERE id = $1 AND is_active = true',
                [decoded.userId]
            );
            
            if (userResult.rows.length === 0) {
                return { authenticated: false };
            }
            
            return {
                authenticated: true,
                user: userResult.rows[0],
                token: decoded
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return { authenticated: false };
        }
    },

    // Log action for audit
    async logAction(userId, action, entityType, entityId, details = {}) {
        try {
            await pool.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, action, entityType, entityId, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('Audit log error:', error);
        }
    },

    // Get clinics for super admin
    async getClinics() {
        try {
            const result = await pool.query(
                `SELECT id, clinic_name, email, phone, address, 
                        subscription_status, usage_count, usage_limit, 
                        is_active, created_at
                 FROM clinics 
                 ORDER BY created_at DESC`
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching clinics:', error);
            return [];
        }
    }
};
