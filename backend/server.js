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

// loginAttempts lagrar antalet misslyckade försök
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const TIMEOUT_PERIOD = 30 * 1000; // 30 sekunder

// inloggning
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

  //kollar om inputen för användarnamnet innehåller tillåtna tecken
  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).send('Server error.');
    }
    
    // detta blocket är för användare som inte finns
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

    // detta block är för användare som finns men ger samma information
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

      // om inloggning lyckas återställs försöksspärren
      if (loginAttempts[username]) {
        delete loginAttempts[username];
      }

      res.json({ message: 'Inloggning lyckades!', userId: user.id, role: user.role });
    });
  });
});

// registrering
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validerar lösenordet
  const symbolPattern = /[!@#$%^&*(),.?":{}|<>]/g;
  const hasTwoSymbols = (password.match(symbolPattern) || []).length >= 2;

  // kollar om lösenordet uppfyller kraven
  if (password.length < 15 && !(password.length >= 10 && hasTwoSymbols)) {
    return res.status(400).send('Lösenordet måste vara minst 15 tecken långt, eller minst 10 tecken långt och innehålla minst två symboler.');
  }

  try {
    // hashar lösenordet INNAN det sparas
    const hashedPassword = await bcrypt.hash(password, 10);

    // alla användare som skapas blir users
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

// hämta alla produkter
app.get('/products', (req, res) => {
  connection.query('SELECT id, name, description, price FROM products', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// skapa en ny produkt
app.post('/products', async (req, res) => {
  const { name, description, price } = req.body;

  try {
    await connection.promise().query('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', 
      [name, description, price]);
    // skickar ett JSON-objekt som svar
    res.status(201).json({ message: 'Produkt skapad!' });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Fel vid skapande av produkt.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
