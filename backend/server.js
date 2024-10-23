import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors';
import connection from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const TIMEOUT_PERIOD = 30 * 1000; // 30 sekunder

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // kollar om användaren redan har gjort för många försök
  if (loginAttempts[username] && loginAttempts[username].attempts >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - loginAttempts[username].lastAttempt;
    if (timeSinceLastAttempt < TIMEOUT_PERIOD) {
      const remainingTime = Math.ceil((TIMEOUT_PERIOD - timeSinceLastAttempt) / 1000); // Räkna ned tiden i sekunder
      return res.status(429).json({ message: 'För många misslyckade försök. Försök igen senare.', remainingTime });
    }
    // återställer räkningen efter timeout-perioden
    loginAttempts[username].attempts = 0;
  }

  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).send('Server error.');
    }
    
    //detta blocket är för användare som inte finns
    if (results.length === 0) {
      // ökar antalet misslyckade försök för användaren
      if (!loginAttempts[username]) {
        loginAttempts[username] = { attempts: 1, lastAttempt: Date.now() };
      } else {
        loginAttempts[username].attempts += 1;
        loginAttempts[username].lastAttempt = Date.now();
      }
      return res.status(401).send('Felaktigt användarnamn eller lösenord.');
    }

    const user = results[0];

    //detta block är för användare som finns men ger samma information
    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) {
        // ökar antalet misslyckade försök för användaren
        if (!loginAttempts[username]) {
          loginAttempts[username] = { attempts: 1, lastAttempt: Date.now() };
        } else {
          loginAttempts[username].attempts += 1;
          loginAttempts[username].lastAttempt = Date.now();
        }
        return res.status(401).send('Felaktigt användarnamn eller lösenord.');
      }

      // om inloggnig lyckas återställs försöksspärren
      if (loginAttempts[username]) {
        delete loginAttempts[username];
      }

      res.json({ message: 'Inloggning lyckades!', userId: user.id, role: user.role });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
