// Embedded Assessment Module for Celloxen Dashboard
const AssessmentEmbed = {
    currentSession: null,
    patientInfo: null,
    clinicInfo: null,
    
    // Initialize assessment
    async init(patientId, patientName, clinicId) {
        this.patientInfo = { id: patientId, name: patientName };
        this.clinicInfo = { id: clinicId };
        
        try {
            const response = await fetch('/api/embeddedHealthAgent', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'start',
                    clinicId: clinicId,
                    patientId: patientId,
                    patientName: patientName
                })
            });
            
            const data = await response.json();
            this.currentSession = data.sessionId;
            
            // Clear chat and add first message
            this.clearChat();
            this.addMessage(data.message, 'assistant');
            
            return true;
        } catch (error) {
            console.error('Error starting assessment:', error);
            this.showError('Failed to start assessment');
            return false;
        }
    },
    
    // Send message to assessment API
    async sendMessage(message) {
        if (!message || !this.currentSession) return;
        
        this.addMessage(message, 'user');
        this.clearInput();
        
        try {
            const response = await fetch('/api/embeddedHealthAgent', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'chat',
                    sessionId: this.currentSession,
                    message: message
                })
            });
            
            const data = await response.json();
            this.addMessage(data.message, 'assistant');
            
            if (data.phase === 'report_complete') {
                this.handleCompletion();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message');
        }
    },
    
    // Add message to chat display
    addMessage(message, sender) {
        const chatDiv = document.getElementById('assessmentChat');
        if (!chatDiv) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        
        // Handle multi-line messages
        if (message.includes('\n')) {
            msgDiv.innerHTML = message.replace(/\n/g, '<br>');
        } else {
            msgDiv.textContent = message;
        }
        
        chatDiv.appendChild(msgDiv);
        chatDiv.scrollTop = chatDiv.scrollHeight;
    },
    
    // Clear chat display
    clearChat() {
        const chatDiv = document.getElementById('assessmentChat');
        if (chatDiv) chatDiv.innerHTML = '';
    },
    
    // Clear input field
    clearInput() {
        const input = document.getElementById('assessmentInput');
        if (input) input.value = '';
    },
    
    // Handle assessment completion
    handleCompletion() {
        if (typeof showAlert === 'function') {
            showAlert('Assessment completed successfully!', 'success');
        }
        
        setTimeout(() => {
            this.close();
            if (typeof loadDashboard === 'function') {
                loadDashboard();
            }
        }, 3000);
    },
    
    // Show error message
    showError(message) {
        if (typeof showAlert === 'function') {
            showAlert(message, 'error');
        } else {
            alert(message);
        }
    },
    
    // Close assessment
    close() {
        document.getElementById('embeddedAssessmentSection').style.display = 'none';
        if (typeof backToPatientList === 'function') {
            backToPatientList();
        }
        this.currentSession = null;
    },
    
    // Cancel assessment
    cancel() {
        if (confirm('Are you sure you want to cancel this assessment?')) {
            this.close();
        }
    },
    
    // Setup event listeners
    setupListeners() {
        const input = document.getElementById('assessmentInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(input.value.trim());
                }
            });
        }
    }
};

// Export for use in clinic.html
window.AssessmentEmbed = AssessmentEmbed;
