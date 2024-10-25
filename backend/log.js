
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// löser problem med es moduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// loggfil
const logFilePath = path.join(__dirname, 'loginAttempts.log');
console.log('Log file path:', logFilePath); 

export const logLoginAttempt = (username, success) => {
  const timestamp = new Date().toISOString();
  // sanerar användarnamn för att undvika XSS
  const sanitizedUsername = username.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 

  const logMessage = `${timestamp} - Username: ${sanitizedUsername} - Success: ${success}\n`;
  console.log(`inloggnings händelser: ${logMessage}`); 

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write login attempt to log file:', err);
    }
  });
};
