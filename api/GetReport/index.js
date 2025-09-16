const db = require('../shared/database');

module.exports = async function (context, req) {
    const reportId = req.query.id;
    
    if (!reportId) {
        context.res = {
            status: 400,
            body: { success: false, message: "Report ID required" }
        };
        return;
    }
    
    try {
        const report = await db.getReport(reportId);
        
        if (report) {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: { success: true, report: report }
            };
        } else {
            context.res = {
                status: 404,
                body: { success: false, message: "Report not found" }
            };
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: { success: false, error: error.message }
        };
    }
};
