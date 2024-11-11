import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connection from './db.js';
import { format } from 'date-fns';

// löser problem med ES-moduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// loggfilen
const logFilePath = path.join(__dirname, 'loginAttempts.log');
console.log('Log file path:', logFilePath);

// funktion för att extrahera webbläsarens namn från userAgent-strängen
const getBrowserName = (userAgent) => {
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
  return "Unknown";
};

export const logLoginAttempt = (username, success, ip, userAgent) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const sanitizedUsername = username.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // använder `getBrowserName` för att extrahera endast webbläsarnamnet
  const browserName = getBrowserName(userAgent);

  const logMessage = `${timestamp} - Username: ${sanitizedUsername} - Success: ${success} - IP: ${ip} - Browser: ${browserName}\n`;
  console.log(`Inloggningshändelser: ${logMessage}`);

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write login attempt to log file:', err);
    }
  });

  const query = `
    INSERT INTO login_logs (timestamp, username, success, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `;

  // sparar browserName i stället för hela userAgent-strängen
  connection.query(
    query,
    [timestamp, sanitizedUsername, success, ip, browserName],
    (err, results) => {
      if (err) {
        console.error('Failed to log login attempt in database:', err.message);
      } else {
        console.log('Login attempt successfully logged in database');
      }
    }
  );
};
