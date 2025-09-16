// Helper functions for clinic integration
module.exports = {
    getClinicFromSession: (sessionStorage) => {
        // Get clinic ID from session
        return sessionStorage?.clinicId || null;
    },
    
    validateClinicAccess: async (clinicId, pool) => {
        // Check if clinic is active and has available usage
        const result = await pool.query(
            'SELECT is_active, usage_count, usage_limit FROM clinics WHERE id = $1',
            [clinicId]
        );
        
        if (result.rows.length === 0) return false;
        
        const clinic = result.rows[0];
        return clinic.is_active && clinic.usage_count < clinic.usage_limit;
    },
    
    incrementClinicUsage: async (clinicId, pool) => {
        // Increment usage count when assessment starts
        await pool.query(
            'UPDATE clinics SET usage_count = usage_count + 1 WHERE id = $1',
            [clinicId]
        );
    }
};
