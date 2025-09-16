module.exports = async function (context, req) {
    context.log('Health Agent API called');
    
    const action = req.query.action || 'test';
    
    if (action === 'test') {
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                message: "AI Health Agent is working!",
                timestamp: new Date().toISOString()
            }
        };
    } else if (action === 'start') {
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: {
                success: true,
                sessionId: "test-session-123",
                message: "Hello! I'm your AI Health Assistant. What health concerns can I help you with today?"
            }
        };
    }
};
