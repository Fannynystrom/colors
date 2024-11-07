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

// andvändning av produkt-routes
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

  const symbolPattern = /[!@#$%^&*(),.?":{}|<>]/g;
  const hasTwoSymbols = (password.match(symbolPattern) || []).length >= 2;

  if (password.length < 15 && !(password.length >= 10 && hasTwoSymbols)) {
    return res.status(400).send('Lösenordet måste vara minst 15 tecken långt, eller minst 10 tecken långt och innehålla minst två symboler.');
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
        res.status(201).send('Användare skapad!');
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

// skapa kommentarer
app.post('/comments', (req, res) => {
  const { productId, text } = req.body;

  connection.query(
    'INSERT INTO comments (productId, text) VALUES (?, ?)',
    [productId, text],
    (err, results) => {
      if (err) {
        return res.status(500).send('Error saving comment');
      }
      res.status(201).json({ id: results.insertId, productId, text });
    }
  );
});

// hämta kommentarer
app.get('/comments/:productId', (req, res) => {
  const { productId } = req.params;

  connection.query(
    'SELECT * FROM comments WHERE productId = ?',
    [productId],
    (err, results) => {
      if (err) {
        return res.status(500).send('Error fetching comments');
      }
      res.json(results);
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
