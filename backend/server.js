import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors';
import connection from './db.js';
import { logLoginAttempt } from './log.js';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// statisk mapp för att visa uppladdade bilder
app.use('/uploads', express.static('uploads'));

// användning av produkt och bildrutter
app.use('/products', productRoutes);

// loginAttempts lagrar antalet misslyckade försök
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const TIMEOUT_PERIOD = 30 * 1000; // 30 sekunder

// hämtar de 100 senaste inloggningsförsöken
app.get('/login-logs', (req, res) => {
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
//sql bibloteket sanerar mot injektion, ett extra skydd trots ovan
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
      res.json({ message: 'Inloggning lyckades!', userId: user.id, role: user.role });
    });
  });
});


// registrering
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // kontrollerar lösenordets styrka
  const symbolPattern = /[!@#$%^&*(),.?":{}|<>]/g;
  const hasTwoSymbols = (password.match(symbolPattern) || []).length >= 2;

  // kontrollerar om lösenordet är likt användarnamnet
  const isSimilarToUsername = password.toLowerCase().includes(username.toLowerCase());

  // kontrollera om lösenordet bara är upprepade tecken
  const isRepeatedCharacters = /^(\w)\1*$/.test(password);

  if (isSimilarToUsername) {
  }

  // kraven för lösenordslängd och komplexitet
  if (
    password.length < 8 || 
    password.length < 15 && !(password.length >= 10 && hasTwoSymbols) ||
    isSimilarToUsername || // inte likna användarnamnet
    isRepeatedCharacters    //  inte bara vara samma tecken repeterat
  ) {
    return res.status(400).send('Lösenordet måste vara minst 15 tecken långt, eller minst 10 tecken långt och innehålla minst två symboler, och inte likna användarnamnet eller endast bestå av repeterade tecken.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
//extra skydd mot injektion med sql bibloteket
    connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'user'],
      (err, results) => {
        if (err) {
          return res.status(500).send('Registrering misslyckades.');
        }
      }
    );
  } catch (err) {
    res.status(500).send('Något gick fel vid registreringen.');
  }
});


// hämtar användare
app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
