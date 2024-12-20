// server.js
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors';
import connection from './db.js';
import { logLoginAttempt } from './log.js';
import productRoutes from './routes/productRoutes.js';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRoles } from './authMiddleware.js';
import adminRoutes from './routes/adminRoutes.js'; 
import zxcvbn from 'zxcvbn'; 


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// den statiska mappen för att visa uppladdade bilder
app.use('/uploads', express.static('uploads'));

// användning av produktrutter
app.use('/products', productRoutes);

// användning av administratörsrutter
app.use('/admin', authenticateToken, authorizeRoles('admin'), adminRoutes);

// loginAttempts lagrar antalet misslyckade försök
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const TIMEOUT_PERIOD = 30 * 1000; // 30 sekunder

// hämtar de 100 senaste inloggningsförsöken
app.get('/login-logs', authenticateToken, authorizeRoles('admin'), (req, res) => {
  connection.query(
    'SELECT * FROM login_logs ORDER BY timestamp DESC LIMIT 100',
    (err, results) => {
      if (err) {
        console.error('Error fetching login logs:', err);
        return res.status(500).json({ error: 'Failed to fetch login logs' });
      }
      res.json(results);
    }
  );
});

// inloggning
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const ip = req.headers['x-forwarded-for'] || req.ip;
  const actualIp = ip === '::1' ? '127.0.0.1' : ip;
  const userAgent = req.get('User-Agent');

  if (loginAttempts[username] && loginAttempts[username].attempts >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - loginAttempts[username].lastAttempt;
    if (timeSinceLastAttempt < TIMEOUT_PERIOD) {
      const remainingTime = Math.ceil((TIMEOUT_PERIOD - timeSinceLastAttempt) / 1000);
      return res.status(429).json({ message: 'För många misslyckade försök. Försök igen senare.', remainingTime });
    }
    loginAttempts[username].attempts = 0;
  }

  // SQL-biblioteket sanerar mot injektion, ett extra skydd trots ovan
  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      logLoginAttempt(username, false, actualIp, userAgent);
      return res.status(500).send('Server error.');
    }

    if (results.length === 0) {
      if (!loginAttempts[username]) {
        loginAttempts[username] = { attempts: 1, lastAttempt: Date.now() };
      } else {
        loginAttempts[username].attempts += 1;
        loginAttempts[username].lastAttempt = Date.now();
      }
      logLoginAttempt(username, false, actualIp, userAgent);
      return res.status(401).send('Felaktigt användarnamn eller lösenord.');
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) {
        if (!loginAttempts[username]) {
          loginAttempts[username] = { attempts: 1, lastAttempt: Date.now() };
        } else {
          loginAttempts[username].attempts += 1;
          loginAttempts[username].lastAttempt = Date.now();
        }
        logLoginAttempt(username, false, actualIp, userAgent);
        return res.status(401).send('Felaktigt användarnamn eller lösenord.');
      }

      if (loginAttempts[username]) {
        delete loginAttempts[username];
      }

      logLoginAttempt(username, true, actualIp, userAgent);

      //  payload utan att inkludera känslig information
      const payload = {
        userId: user.id,
        role: user.role
      };

      // signerar JWT
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

      res.json({ message: 'Inloggning lyckades!', token });
    });
  });
});

// registrering
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // kollar om lösenordet är vanligt enligt zxcvbn
  const passwordEvaluation = zxcvbn(password);
  const score = passwordEvaluation.score;

  // kollar om lösenordet är vanligt
  const isCommonPassword = passwordEvaluation.feedback.suggestions.includes("Lägg till ett ord eller två. Ovanliga ord är bättre.");

  // om lösenordet förekommer i zxcvbn, skicka ett specifikt svar och avsluta funktionen 
  if (isCommonPassword) {
    return res.status(400).json({
      message: 'Lösenordet är för vanligt och kan inte användas.',
      suggestions: passwordEvaluation.feedback.suggestions,
    });
  }

  //  andra styrkekrav
  const symbolPattern = /[!@#$%^&*(),.?":{}|<>]/g;
  const hasTwoSymbols = (password.match(symbolPattern) || []).length >= 2;
  const isSimilarToUsername = password.toLowerCase().includes(username.toLowerCase());
  const isRepeatedCharacters = /^(\w)\1*$/.test(password);

  if (
    password.length < 8 || 
    (password.length < 15 && !(password.length >= 10 && hasTwoSymbols)) ||
    isSimilarToUsername || 
    isRepeatedCharacters
  ) {
    return res.status(400).send('Lösenordet måste vara minst 15 tecken långt, eller minst 10 tecken långt och innehålla minst två symboler, och inte likna användarnamnet eller endast bestå av repeterade tecken.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'user'],
      (err, results) => {
        if (err) {
          return res.status(500).send('Registrering misslyckades.');
        }
        res.status(201).json({ message: 'Registrering lyckades!' });
      }
    );
  } catch (err) {
    res.status(500).send('Något gick fel vid registreringen.');
  }
});


// hämtar användare
app.get('/users', authenticateToken, authorizeRoles('admin'), (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
