import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connection from './db.js'; 

// löser problem med ES-moduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// loggfilen
const logFilePath = path.join(__dirname, 'loginAttempts.log');
console.log('Log file path:', logFilePath); 

export const logLoginAttempt = (username, success, ip, userAgent) => {
  const timestamp = new Date().toISOString();
  // sanerar användarnamn för att undvika XSS
  const sanitizedUsername = username.replace(/</g, "&lt;").replace(/>/g, "&gt;"); 

  // meddelande fil-loggning
  const logMessage = `${timestamp} - Username: ${sanitizedUsername} - Success: ${success} - IP: ${ip} - User-Agent: ${userAgent}\n`;
  console.log(`Inloggningshändelser: ${logMessage}`); 

  // sparar till loggfilen
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write login attempt to log file:', err);
    }
  });

  // sparar till databasen
  const query = `
    INSERT INTO login_logs (timestamp, username, success, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [timestamp, sanitizedUsername, success, ip, userAgent],
    (err, results) => {
      if (err) {
        console.error('Failed to log login attempt in database:', err);
      }
    }
  );
};
