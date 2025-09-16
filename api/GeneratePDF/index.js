const PDFDocument = require('pdfkit');
const db = require('../shared/database');

module.exports = async function (context, req) {
    const { sessionId, reportContent } = req.body;
    
    if (!sessionId || !reportContent) {
        context.res = {
            status: 400,
            body: { success: false, message: "Session ID and report content required" }
        };
        return;
    }
    
    try {
        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: 'Celloxen Health Assessment Report',
                Author: 'Celloxen Health System',
                Subject: 'Patient Health Assessment'
            }
        });
        
        // Collect PDF data
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        
        // Parse report content
        const lines = reportContent.split('\n');
        const sessionInfo = lines.find(l => l.includes('Session ID:'))?.split(':')[1]?.trim() || sessionId;
        const date = new Date().toLocaleDateString('en-GB');
        
        // Add header with gradient effect
        doc.rect(0, 0, doc.page.width, 120)
           .fill('#667eea');
        
        // Title
        doc.fillColor('white')
           .fontSize(24)
           .text('CELLOXEN HEALTH', 50, 40, { align: 'center' })
           .fontSize(16)
           .text('Assessment Report', 50, 70, { align: 'center' });
        
        // Reset color for body
        doc.fillColor('black');
        
        // Add logo/branding space
        doc.moveDown(3);
        
        // Patient Information Section
        doc.fontSize(14)
           .fillColor('#667eea')
           .text('PATIENT INFORMATION', 50, 150)
           .fillColor('black')
           .fontSize(11);
        
        // Extract patient info from report
        let currentY = 180;
        let inSection = false;
        let sectionTitle = '';
        
        for (const line of lines) {
            if (line.includes('PATIENT INFORMATION')) {
                inSection = 'patient';
                continue;
            } else if (line.includes('CHIEF COMPLAINTS')) {
                inSection = 'complaints';
                doc.fillColor('#667eea')
                   .fontSize(14)
                   .text('CHIEF COMPLAINTS', 50, currentY + 20);
                currentY += 40;
                doc.fillColor('black').fontSize(11);
                continue;
            } else if (line.includes('CURRENT HEALTH STATE')) {
                inSection = 'health';
                doc.fillColor('#667eea')
                   .fontSize(14)
                   .text('CURRENT HEALTH STATE', 50, currentY + 20);
                currentY += 40;
                doc.fillColor('black').fontSize(11);
                continue;
            } else if (line.includes('RECOMMENDED THERAPY')) {
                inSection = 'therapy';
                // Add therapy box
                doc.rect(50, currentY + 20, doc.page.width - 100, 80)
                   .fillAndStroke('#f8f9fa', '#667eea');
                doc.fillColor('#667eea')
                   .fontSize(14)
                   .text('RECOMMENDED THERAPY', 60, currentY + 30);
                currentY += 50;
                doc.fillColor('black').fontSize(11);
                continue;
            } else if (line.includes('TREATMENT PROTOCOL')) {
                inSection = 'protocol';
                doc.fillColor('#667eea')
                   .fontSize(14)
                   .text('TREATMENT PROTOCOL', 50, currentY + 20);
                currentY += 40;
                
                // Add protocol grid
                const protocols = [
                    { label: 'Duration', value: '40-45 minutes' },
                    { label: 'Frequency', value: '2-3 times/week' },
                    { label: 'Course', value: '8 weeks' },
                    { label: 'Total Sessions', value: '16-24' }
                ];
                
                let gridX = 60;
                let gridY = currentY;
                
                protocols.forEach((item, index) => {
                    if (index % 2 === 0 && index > 0) {
                        gridY += 30;
                        gridX = 60;
                    }
                    doc.fontSize(10)
                       .fillColor('#666')
                       .text(item.label + ':', gridX, gridY)
                       .fillColor('black')
                       .text(item.value, gridX + 80, gridY);
                    gridX += 250;
                });
                
                currentY = gridY + 40;
                doc.fillColor('black').fontSize(11);
                continue;
            } else if (line.includes('SUPPLEMENT RECOMMENDATIONS')) {
                inSection = 'supplements';
                doc.fillColor('#667eea')
                   .fontSize(14)
                   .text('SUPPLEMENT RECOMMENDATIONS', 50, currentY + 20);
                currentY += 40;
                doc.fillColor('black').fontSize(11);
                continue;
            }
            
            // Add content based on section
            if (inSection && line.trim() && !line.includes('====')) {
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 50;
                }
                
                // Format different sections differently
                if (inSection === 'therapy' && line.includes('Therapy Code:')) {
                    doc.fontSize(12)
                       .fillColor('#333')
                       .text(line, 60, currentY);
                } else if (line.startsWith('-')) {
                    // Bullet points
                    doc.fontSize(10)
                       .fillColor('#555')
                       .text('•', 60, currentY)
                       .text(line.substring(1).trim(), 75, currentY);
                } else {
                    doc.fontSize(11)
                       .fillColor('#333')
                       .text(line, 50, currentY);
                }
                currentY += 18;
            }
        }
        
        // Add footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(9)
               .fillColor('#999')
               .text(
                   `Page ${i + 1} of ${pageCount} | Generated: ${date} | Session: ${sessionInfo}`,
                   50,
                   doc.page.height - 40,
                   { align: 'center' }
               );
        }
        
        // Add chart for progress timeline
        if (doc.y < doc.page.height - 200) {
            doc.moveDown(2);
        } else {
            doc.addPage();
        }
        
        doc.fillColor('#667eea')
           .fontSize(14)
           .text('EXPECTED PROGRESS TIMELINE', 50, doc.y);
        
        const chartY = doc.y + 30;
        const chartHeight = 100;
        const chartWidth = doc.page.width - 100;
        
        // Draw progress chart
        const weeks = ['Week 1-2', 'Week 3-4', 'Week 5-6', 'Week 7-8'];
        const progress = [25, 50, 75, 90];
        
        weeks.forEach((week, index) => {
            const x = 50 + (index * (chartWidth / 4));
            const barHeight = (progress[index] / 100) * chartHeight;
            
            // Draw bar
            doc.rect(x + 20, chartY + chartHeight - barHeight, 40, barHeight)
               .fill('#667eea');
            
            // Add label
            doc.fontSize(9)
               .fillColor('#666')
               .text(week, x, chartY + chartHeight + 10, { width: 80, align: 'center' })
               .text(`${progress[index]}%`, x, chartY + chartHeight - barHeight - 15, { width: 80, align: 'center' });
        });
        
        // Finalize PDF
        doc.end();
        
        // Wait for PDF generation to complete
        await new Promise(resolve => doc.on('end', resolve));
        
        // Convert to base64
        const pdfBuffer = Buffer.concat(chunks);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                pdf: pdfBase64,
                filename: `celloxen-report-${sessionId}.pdf`
            }
        };
        
    } catch (error) {
        context.log.error('PDF generation error:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                error: error.message
            }
        };
    }
};
