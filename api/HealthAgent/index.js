const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
    context.log('Health Agent API called');
    
    const action = req.query.action || req.body?.action || 'test';
    
    try {
        switch(action) {
            case 'test':
                context.res = {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        success: true,
                        message: "✅ AI Health Agent API is working!",
                        timestamp: new Date().toISOString(),
                        version: "1.0.0",
                        status: "Connected to Azure Functions"
                    }
                };
                break;
                
            case 'start':
                const sessionId = uuidv4();
                context.res = {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        success: true,
                        sessionId: sessionId,
                        message: "Hello! I'm your AI Health Assistant. Tell me, what brings you here today? What health concerns would you like to discuss?",
                        phase: "initial",
                        timestamp: new Date().toISOString()
                    }
                };
                break;
                
            case 'chat':
                const userMessage = req.body?.message || "No message provided";
                context.res = {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        success: true,
                        response: `I understand you said: "${userMessage}". Let me help you with that. Can you tell me more about when this started?`,
                        phase: "exploration",
                        suggestions: [
                            "Tell me about your symptoms",
                            "How long has this been happening?",
                            "Rate your discomfort from 1-10"
                        ]
                    }
                };
                break;
                
            default:
                context.res = {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: {
                        success: true,
                        message: "Unknown action. Available actions: test, start, chat"
                    }
                };
        }
    } catch (error) {
        context.log.error('Error:', error);
        context.res = {
            status: 500,
            body: { 
                success: false, 
                error: error.message 
            }
        };
    }
};
