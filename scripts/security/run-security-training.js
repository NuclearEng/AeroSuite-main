#!/usr/bin/env node

/**
 * Security Training Automation Script
 * 
 * This script automates the process of conducting security training sessions,
 * tracking completion, and generating reports.
 * 
 * Task: SEC12 - Security training for development team
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  trainingDir: path.join(__dirname, '../../docs/security/training'),
  outputDir: path.join(__dirname, '../../reports/security-training'),
  dbPath: path.join(__dirname, '../../data/security-training-db.json'),
  modules: [
    { id: 'SEC-FUND', name: 'Security Fundamentals', file: '01-security-fundamentals.md', requiredScore: 80 },
    { id: 'SEC-CODE', name: 'Secure Coding Practices', file: '02-secure-coding-practices.md', requiredScore: 80 },
    { id: 'SEC-AUTH', name: 'Authentication & Authorization', file: '03-authentication-authorization.md', requiredScore: 80 },
    { id: 'SEC-DATA', name: 'Data Protection & Privacy', file: '04-data-protection-privacy.md', requiredScore: 80 },
    { id: 'SEC-API', name: 'API Security', file: '05-api-security.md', requiredScore: 80 },
    { id: 'SEC-FRONT', name: 'Frontend Security', file: '06-frontend-security.md', requiredScore: 80 },
    { id: 'SEC-INFRA', name: 'Infrastructure Security', file: '07-infrastructure-security.md', requiredScore: 80 },
    { id: 'SEC-TEST', name: 'Security Testing', file: '08-security-testing.md', requiredScore: 80 },
    { id: 'SEC-IR', name: 'Incident Response', file: '09-incident-response.md', requiredScore: 80 },
    { id: 'SEC-TOOLS', name: 'Security Tools & Resources', file: '10-security-tools-resources.md', requiredScore: 80 }
  ]
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Ensure data directory exists
const dataDir = path.dirname(CONFIG.dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize or load training database
let trainingDb = { users: {}, sessions: [] };
if (fs.existsSync(CONFIG.dbPath)) {
  try {
    trainingDb = JSON.parse(fs.readFileSync(CONFIG.dbPath, 'utf8'));
  } catch (error) {
    console.error(`Error loading training database: ${error.message}`);
    console.log('Starting with a fresh database');
  }
}

// Save training database
function saveTrainingDb() {
  try {
    fs.writeFileSync(CONFIG.dbPath, JSON.stringify(trainingDb, null, 2));
  } catch (error) {
    console.error(`Error saving training database: ${error.message}`);
  }
}

// Command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main menu
function showMainMenu() {
  console.clear();
  console.log('=== AeroSuite Security Training System ===');
  console.log('1. Schedule Training Session');
  console.log('2. Record Training Completion');
  console.log('3. Generate Training Report');
  console.log('4. View Developer Training Status');
  console.log('5. Send Training Reminders');
  console.log('6. Exit');
  console.log('');
  
  rl.question('Select an option: ', (answer) => {
    switch (answer) {
      case '1':
        scheduleTraining();
        break;
      case '2':
        recordTrainingCompletion();
        break;
      case '3':
        generateTrainingReport();
        break;
      case '4':
        viewDeveloperStatus();
        break;
      case '5':
        sendTrainingReminders();
        break;
      case '6':
        console.log('Exiting...');
        rl.close();
        break;
      default:
        console.log('Invalid option. Press Enter to continue...');
        rl.question('', () => showMainMenu());
    }
  });
}

// Schedule a training session
function scheduleTraining() {
  console.clear();
  console.log('=== Schedule Training Session ===');
  
  // List modules
  console.log('Available Modules:');
  CONFIG.modules.forEach((module, index) => {
    console.log(`${index + 1}. ${module.name}`);
  });
  
  rl.question('Select module (number): ', (moduleAnswer) => {
    const moduleIndex = parseInt(moduleAnswer) - 1;
    
    if (isNaN(moduleIndex) || moduleIndex < 0 || moduleIndex >= CONFIG.modules.length) {
      console.log('Invalid module selection. Press Enter to continue...');
      rl.question('', () => scheduleTraining());
      return;
    }
    
    const selectedModule = CONFIG.modules[moduleIndex];
    
    rl.question('Date (YYYY-MM-DD): ', (dateAnswer) => {
      const date = new Date(dateAnswer);
      
      if (isNaN(date.getTime())) {
        console.log('Invalid date format. Press Enter to continue...');
        rl.question('', () => scheduleTraining());
        return;
      }
      
      rl.question('Time (HH:MM): ', (timeAnswer) => {
        const [hours, minutes] = timeAnswer.split(':').map(Number);
        
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          console.log('Invalid time format. Press Enter to continue...');
          rl.question('', () => scheduleTraining());
          return;
        }
        
        date.setHours(hours, minutes);
        
        rl.question('Instructor: ', (instructor) => {
          rl.question('Location: ', (location) => {
            rl.question('Max Participants: ', (maxParticipantsAnswer) => {
              const maxParticipants = parseInt(maxParticipantsAnswer);
              
              if (isNaN(maxParticipants) || maxParticipants <= 0) {
                console.log('Invalid number of participants. Press Enter to continue...');
                rl.question('', () => scheduleTraining());
                return;
              }
              
              // Create session
              const session = {
                id: `SESSION-${Date.now()}`,
                moduleId: selectedModule.id,
                moduleName: selectedModule.name,
                date: date.toISOString(),
                instructor,
                location,
                maxParticipants,
                participants: [],
                completed: false
              };
              
              trainingDb.sessions.push(session);
              saveTrainingDb();
              
              console.log(`\nSession scheduled: ${selectedModule.name} on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`);
              console.log('Press Enter to continue...');
              rl.question('', () => showMainMenu());
            });
          });
        });
      });
    });
  });
}

// Record training completion
function recordTrainingCompletion() {
  console.clear();
  console.log('=== Record Training Completion ===');
  
  // List sessions
  const pendingSessions = trainingDb.sessions.filter(session => !session.completed);
  
  if (pendingSessions.length === 0) {
    console.log('No pending sessions to record. Press Enter to continue...');
    rl.question('', () => showMainMenu());
    return;
  }
  
  console.log('Pending Sessions:');
  pendingSessions.forEach((session, index) => {
    const date = new Date(session.date);
    console.log(`${index + 1}. ${session.moduleName} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
  });
  
  rl.question('Select session (number): ', (sessionAnswer) => {
    const sessionIndex = parseInt(sessionAnswer) - 1;
    
    if (isNaN(sessionIndex) || sessionIndex < 0 || sessionIndex >= pendingSessions.length) {
      console.log('Invalid session selection. Press Enter to continue...');
      rl.question('', () => recordTrainingCompletion());
      return;
    }
    
    const selectedSession = pendingSessions[sessionIndex];
    
    rl.question('Enter participants (comma-separated usernames): ', (participantsAnswer) => {
      const participants = participantsAnswer.split(',').map(p => p.trim()).filter(p => p);
      
      if (participants.length === 0) {
        console.log('No participants entered. Press Enter to continue...');
        rl.question('', () => recordTrainingCompletion());
        return;
      }
      
      // Record participants
      selectedSession.participants = participants;
      
      // Update user records
      participants.forEach(username => {
        if (!trainingDb.users[username]) {
          trainingDb.users[username] = {
            username,
            completedModules: {},
            lastTraining: null,
            certificationDate: null
          };
        }
        
        trainingDb.users[username].completedModules[selectedSession.moduleId] = {
          date: selectedSession.date,
          instructor: selectedSession.instructor
        };
        
        trainingDb.users[username].lastTraining = selectedSession.date;
        
        // Check if all required modules are completed for certification
        const allModulesCompleted = CONFIG.modules.every(module => 
          trainingDb.users[username].completedModules[module.id]);
        
        if (allModulesCompleted) {
          trainingDb.users[username].certificationDate = new Date().toISOString();
        }
      });
      
      // Mark session as completed
      selectedSession.completed = true;
      saveTrainingDb();
      
      console.log(`\nTraining completion recorded for ${participants.length} participants`);
      console.log('Press Enter to continue...');
      rl.question('', () => showMainMenu());
    });
  });
}

// Generate training report
function generateTrainingReport() {
  console.clear();
  console.log('=== Generate Training Report ===');
  
  rl.question('Report type (1: Summary, 2: Detailed, 3: Compliance): ', (reportTypeAnswer) => {
    const reportType = parseInt(reportTypeAnswer);
    
    if (isNaN(reportType) || reportType < 1 || reportType > 3) {
      console.log('Invalid report type. Press Enter to continue...');
      rl.question('', () => generateTrainingReport());
      return;
    }
    
    // Generate report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `security-training-report-${reportType}-${timestamp}.md`;
    const reportPath = path.join(CONFIG.outputDir, reportFileName);
    
    let reportContent = '';
    
    switch (reportType) {
      case 1: // Summary report
        reportContent = generateSummaryReport();
        break;
      case 2: // Detailed report
        reportContent = generateDetailedReport();
        break;
      case 3: // Compliance report
        reportContent = generateComplianceReport();
        break;
    }
    
    fs.writeFileSync(reportPath, reportContent);
    
    console.log(`\nReport generated: ${reportPath}`);
    console.log('Press Enter to continue...');
    rl.question('', () => showMainMenu());
  });
}

// Generate summary report
function generateSummaryReport() {
  const totalUsers = Object.keys(trainingDb.users).length;
  const certifiedUsers = Object.values(trainingDb.users).filter(user => user.certificationDate).length;
  const totalSessions = trainingDb.sessions.length;
  const completedSessions = trainingDb.sessions.filter(session => session.completed).length;
  
  // Calculate module completion statistics
  const moduleStats = {};
  CONFIG.modules.forEach(module => {
    moduleStats[module.id] = {
      name: module.name,
      completed: 0,
      pending: totalUsers
    };
  });
  
  Object.values(trainingDb.users).forEach(user => {
    Object.keys(user.completedModules).forEach(moduleId => {
      if (moduleStats[moduleId]) {
        moduleStats[moduleId].completed++;
        moduleStats[moduleId].pending--;
      }
    });
  });
  
  let report = `# AeroSuite Security Training Summary Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Overall Statistics\n\n`;
  report += `- Total Developers: ${totalUsers}\n`;
  report += `- Certified Developers: ${certifiedUsers} (${Math.round(certifiedUsers / totalUsers * 100)}%)\n`;
  report += `- Total Training Sessions: ${totalSessions}\n`;
  report += `- Completed Sessions: ${completedSessions}\n\n`;
  
  report += `## Module Completion\n\n`;
  report += `| Module | Completed | Pending | Completion Rate |\n`;
  report += `|--------|-----------|---------|----------------|\n`;
  
  Object.values(moduleStats).forEach(stat => {
    const completionRate = totalUsers > 0 ? Math.round(stat.completed / totalUsers * 100) : 0;
    report += `| ${stat.name} | ${stat.completed} | ${stat.pending} | ${completionRate}% |\n`;
  });
  
  return report;
}

// Generate detailed report
function generateDetailedReport() {
  let report = `# AeroSuite Security Training Detailed Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Developer Training Status\n\n`;
  report += `| Developer | Modules Completed | Last Training | Certified |\n`;
  report += `|-----------|-------------------|---------------|----------|\n`;
  
  Object.values(trainingDb.users).sort((a, b) => a.username.localeCompare(b.username)).forEach(user => {
    const modulesCompleted = Object.keys(user.completedModules).length;
    const lastTraining = user.lastTraining ? new Date(user.lastTraining).toLocaleDateString() : 'N/A';
    const certified = user.certificationDate ? '✅' : '❌';
    
    report += `| ${user.username} | ${modulesCompleted}/${CONFIG.modules.length} | ${lastTraining} | ${certified} |\n`;
  });
  
  report += `\n## Recent Training Sessions\n\n`;
  report += `| Date | Module | Instructor | Participants |\n`;
  report += `|------|--------|------------|-------------|\n`;
  
  trainingDb.sessions
    .filter(session => session.completed)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .forEach(session => {
      const date = new Date(session.date).toLocaleDateString();
      const participants = session.participants.length;
      
      report += `| ${date} | ${session.moduleName} | ${session.instructor} | ${participants} |\n`;
    });
  
  report += `\n## Module Details\n\n`;
  
  CONFIG.modules.forEach(module => {
    const completedCount = Object.values(trainingDb.users).filter(user => 
      user.completedModules[module.id]).length;
    const completionRate = Object.keys(trainingDb.users).length > 0 ? 
      Math.round(completedCount / Object.keys(trainingDb.users).length * 100) : 0;
    
    report += `### ${module.name}\n\n`;
    report += `- Module ID: ${module.id}\n`;
    report += `- Completion Rate: ${completionRate}%\n`;
    report += `- Developers Completed: ${completedCount}\n`;
    report += `- Required Score: ${module.requiredScore}%\n\n`;
  });
  
  return report;
}

// Generate compliance report
function generateComplianceReport() {
  const totalUsers = Object.keys(trainingDb.users).length;
  const certifiedUsers = Object.values(trainingDb.users).filter(user => user.certificationDate).length;
  const complianceRate = totalUsers > 0 ? Math.round(certifiedUsers / totalUsers * 100) : 0;
  
  // Calculate days since last training for each user
  const today = new Date();
  const userTrainingAge = {};
  
  Object.entries(trainingDb.users).forEach(([username, user]) => {
    if (user.lastTraining) {
      const lastTrainingDate = new Date(user.lastTraining);
      const daysSince = Math.floor((today - lastTrainingDate) / (1000 * 60 * 60 * 24));
      userTrainingAge[username] = daysSince;
    } else {
      userTrainingAge[username] = null;
    }
  });
  
  // Calculate users needing retraining (more than 365 days)
  const usersNeedingRetraining = Object.entries(userTrainingAge)
    .filter(([_, days]) => days !== null && days > 365)
    .map(([username]) => username);
  
  let report = `# AeroSuite Security Training Compliance Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Compliance Summary\n\n`;
  report += `- Total Developers: ${totalUsers}\n`;
  report += `- Certified Developers: ${certifiedUsers}\n`;
  report += `- Overall Compliance Rate: ${complianceRate}%\n`;
  report += `- Developers Needing Retraining: ${usersNeedingRetraining.length}\n\n`;
  
  report += `## Compliance Status by Module\n\n`;
  report += `| Module | Required | Compliant | Compliance Rate |\n`;
  report += `|--------|----------|-----------|----------------|\n`;
  
  CONFIG.modules.forEach(module => {
    const isRequired = true; // All modules are required
    const compliantCount = Object.values(trainingDb.users).filter(user => 
      user.completedModules[module.id]).length;
    const complianceRate = totalUsers > 0 ? Math.round(compliantCount / totalUsers * 100) : 0;
    
    report += `| ${module.name} | ${isRequired ? '✅' : '❌'} | ${compliantCount} | ${complianceRate}% |\n`;
  });
  
  report += `\n## Developers Needing Retraining\n\n`;
  
  if (usersNeedingRetraining.length === 0) {
    report += `No developers currently need retraining.\n\n`;
  } else {
    report += `| Developer | Days Since Last Training | Modules Missing |\n`;
    report += `|-----------|--------------------------|----------------|\n`;
    
    usersNeedingRetraining.forEach(username => {
      const user = trainingDb.users[username];
      const daysSince = userTrainingAge[username];
      
      const missingModules = CONFIG.modules
        .filter(module => !user.completedModules[module.id])
        .map(module => module.name)
        .join(', ');
      
      report += `| ${username} | ${daysSince} | ${missingModules || 'None'} |\n`;
    });
  }
  
  report += `\n## Compliance Requirements\n\n`;
  report += `- All developers must complete security training within 30 days of joining\n`;
  report += `- Annual retraining is required for all developers\n`;
  report += `- Minimum passing score for each module: 80%\n`;
  report += `- All modules must be completed for certification\n\n`;
  
  return report;
}

// View developer training status
function viewDeveloperStatus() {
  console.clear();
  console.log('=== Developer Training Status ===');
  
  rl.question('Enter developer username (or leave blank for all): ', (username) => {
    if (username && !trainingDb.users[username]) {
      console.log(`Developer ${username} not found. Press Enter to continue...`);
      rl.question('', () => viewDeveloperStatus());
      return;
    }
    
    if (username) {
      // Show status for a specific developer
      const user = trainingDb.users[username];
      console.log(`\nDeveloper: ${username}`);
      console.log(`Last Training: ${user.lastTraining ? new Date(user.lastTraining).toLocaleDateString() : 'Never'}`);
      console.log(`Certification: ${user.certificationDate ? `Yes (${new Date(user.certificationDate).toLocaleDateString()})` : 'No'}`);
      
      console.log('\nModule Completion:');
      CONFIG.modules.forEach(module => {
        const completed = user.completedModules[module.id];
        console.log(`- ${module.name}: ${completed ? `Completed on ${new Date(completed.date).toLocaleDateString()}` : 'Not completed'}`);
      });
    } else {
      // Show status for all developers
      console.log('\nAll Developers:');
      console.log('--------------------------------------------------');
      console.log('Username       | Modules | Last Training | Certified');
      console.log('--------------------------------------------------');
      
      Object.entries(trainingDb.users).sort(([a], [b]) => a.localeCompare(b)).forEach(([username, user]) => {
        const modulesCompleted = Object.keys(user.completedModules).length;
        const lastTraining = user.lastTraining ? new Date(user.lastTraining).toLocaleDateString() : 'Never';
        const certified = user.certificationDate ? 'Yes' : 'No';
        
        console.log(`${username.padEnd(15)} | ${modulesCompleted}/${CONFIG.modules.length}     | ${lastTraining.padEnd(12)} | ${certified}`);
      });
    }
    
    console.log('\nPress Enter to continue...');
    rl.question('', () => showMainMenu());
  });
}

// Send training reminders
function sendTrainingReminders() {
  console.clear();
  console.log('=== Send Training Reminders ===');
  
  rl.question('Reminder type (1: Upcoming Sessions, 2: Incomplete Modules, 3: Certification Expiry): ', (reminderTypeAnswer) => {
    const reminderType = parseInt(reminderTypeAnswer);
    
    if (isNaN(reminderType) || reminderType < 1 || reminderType > 3) {
      console.log('Invalid reminder type. Press Enter to continue...');
      rl.question('', () => sendTrainingReminders());
      return;
    }
    
    switch (reminderType) {
      case 1: // Upcoming sessions
        sendUpcomingSessionReminders();
        break;
      case 2: // Incomplete modules
        sendIncompleteModuleReminders();
        break;
      case 3: // Certification expiry
        sendCertificationExpiryReminders();
        break;
    }
  });
}

// Send upcoming session reminders
function sendUpcomingSessionReminders() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingSessions = trainingDb.sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return !session.completed && sessionDate >= today && sessionDate <= nextWeek;
  });
  
  if (upcomingSessions.length === 0) {
    console.log('No upcoming sessions in the next 7 days. Press Enter to continue...');
    rl.question('', () => showMainMenu());
    return;
  }
  
  console.log(`\nFound ${upcomingSessions.length} upcoming sessions:`);
  upcomingSessions.forEach((session, index) => {
    const date = new Date(session.date);
    console.log(`${index + 1}. ${session.moduleName} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
  });
  
  rl.question('Select session to send reminders for (number): ', (sessionAnswer) => {
    const sessionIndex = parseInt(sessionAnswer) - 1;
    
    if (isNaN(sessionIndex) || sessionIndex < 0 || sessionIndex >= upcomingSessions.length) {
      console.log('Invalid session selection. Press Enter to continue...');
      rl.question('', () => sendUpcomingSessionReminders());
      return;
    }
    
    const selectedSession = upcomingSessions[sessionIndex];
    
    // In a real system, this would send emails or notifications
    // For this demo, we'll just log the reminders
    console.log(`\nSending reminders for ${selectedSession.moduleName} on ${new Date(selectedSession.date).toLocaleString()}`);
    
    // Get developers who haven't completed this module
    const eligibleDevelopers = Object.entries(trainingDb.users)
      .filter(([_, user]) => !user.completedModules[selectedSession.moduleId])
      .map(([username]) => username);
    
    console.log(`Reminders would be sent to ${eligibleDevelopers.length} developers:`);
    eligibleDevelopers.forEach(username => console.log(`- ${username}`));
    
    console.log('\nPress Enter to continue...');
    rl.question('', () => showMainMenu());
  });
}

// Send incomplete module reminders
function sendIncompleteModuleReminders() {
  // Get developers with incomplete modules
  const developersWithIncompleteModules = Object.entries(trainingDb.users)
    .filter(([_, user]) => Object.keys(user.completedModules).length < CONFIG.modules.length)
    .map(([username, user]) => {
      const incompleteModules = CONFIG.modules
        .filter(module => !user.completedModules[module.id])
        .map(module => module.name);
      
      return {
        username,
        incompleteModules
      };
    });
  
  if (developersWithIncompleteModules.length === 0) {
    console.log('All developers have completed all modules. Press Enter to continue...');
    rl.question('', () => showMainMenu());
    return;
  }
  
  console.log(`\nFound ${developersWithIncompleteModules.length} developers with incomplete modules:`);
  developersWithIncompleteModules.forEach((dev, index) => {
    console.log(`${index + 1}. ${dev.username} - Missing: ${dev.incompleteModules.join(', ')}`);
  });
  
  console.log('\nIn a real system, reminders would be sent to these developers.');
  console.log('Press Enter to continue...');
  rl.question('', () => showMainMenu());
}

// Send certification expiry reminders
function sendCertificationExpiryReminders() {
  const today = new Date();
  const threeMonthsFromNow = new Date(today);
  threeMonthsFromNow.setMonth(today.getMonth() + 3);
  
  // Get developers whose certification will expire in the next 3 months
  const developersWithExpiringCertification = Object.entries(trainingDb.users)
    .filter(([_, user]) => {
      if (!user.certificationDate) return false;
      
      const certDate = new Date(user.certificationDate);
      const expiryDate = new Date(certDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Certification valid for 1 year
      
      return expiryDate <= threeMonthsFromNow && expiryDate >= today;
    })
    .map(([username, user]) => {
      const certDate = new Date(user.certificationDate);
      const expiryDate = new Date(certDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      return {
        username,
        expiryDate
      };
    });
  
  if (developersWithExpiringCertification.length === 0) {
    console.log('No certifications expiring in the next 3 months. Press Enter to continue...');
    rl.question('', () => showMainMenu());
    return;
  }
  
  console.log(`\nFound ${developersWithExpiringCertification.length} developers with expiring certifications:`);
  developersWithExpiringCertification.forEach((dev, index) => {
    console.log(`${index + 1}. ${dev.username} - Expires: ${dev.expiryDate.toLocaleDateString()}`);
  });
  
  console.log('\nIn a real system, reminders would be sent to these developers.');
  console.log('Press Enter to continue...');
  rl.question('', () => showMainMenu());
}

// Start the application
showMainMenu(); 