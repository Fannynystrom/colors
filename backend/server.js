import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors';
import connection from './db.js';
import { logLoginAttempt } from './log.js'; 

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
  const ip = req.ip; // hämtar IP-adressen från förfrågan
  const userAgent = req.get('User-Agent'); // hämtar User-Agent från förfrågan

  // kollar om användaren redan har gjort för många försök
  if (loginAttempts[username] && loginAttempts[username].attempts >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - loginAttempts[username].lastAttempt;
    if (timeSinceLastAttempt < TIMEOUT_PERIOD) {
      const remainingTime = Math.ceil((TIMEOUT_PERIOD - timeSinceLastAttempt) / 1000); // räknar ned tiden i sekunder
      return res.status(429).json({ message: 'För många misslyckade försök. Försök igen senare.', remainingTime });
    }
    // återställer räkningen efter timeout-perioden
    loginAttempts[username].attempts = 0;
  }

  // Kollar om användarnamnet finns
  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      logLoginAttempt(username, false, ip, userAgent); // loggar misslyckat inloggningsförsök
      return res.status(500).send('Server error.');
    }
    
    // detta blocket är för användare som inte finns
    if (results.length === 0) {
      if (!loginAttempts[username]) {
        loginAttempts[username] = { attempts: 1, lastAttempt: Date.now() };
      } else {
        loginAttempts[username].attempts += 1;
        loginAttempts[username].lastAttempt = Date.now();
      }
      logLoginAttempt(username, false, ip, userAgent); // loggar misslyckat inloggningsförsök på grund av felaktigt användarnamn
      return res.status(401).send('Felaktigt användarnamn eller lösenord.');
    }

    const user = results[0];

    // detta block är för användare som finns men ger samma information
    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) {
        if (!loginAttempts[username]) {
          loginAttempts[username] = { attempts: 1, lastAttempt: Date.now() };
        } else {
          loginAttempts[username].attempts += 1;
          loginAttempts[username].lastAttempt = Date.now();
        }
        logLoginAttempt(username, false, ip, userAgent); // loggar misslyckat inloggningsförsök på grund av felaktigt lösenord
        return res.status(401).send('Felaktigt användarnamn eller lösenord.');
      }

      // om inloggning lyckas återställs försöksspärren
      if (loginAttempts[username]) {
        delete loginAttempts[username];
      }

      logLoginAttempt(username, true, ip, userAgent); // loggar lyckat inloggningsförsök
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
  connection.query('SELECT id, name, description, price, stock FROM products', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


// skapa en ny produkt
app.post('/products', async (req, res) => {
  const { name, description, price, stock } = req.body;

  try {
    await connection.promise().query(
      'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)', 
      [name, description, price, stock]
    );
    res.status(201).json({ message: 'Produkt skapad!' });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Fel vid skapande av produkt.' });
  }
});

//  minska lagerstatus
app.patch('/products/:id/decrementStock', (req, res) => {
  const { id } = req.params;
  const decrementAmount = req.body.amount || 1; // minskar med en åt gången

  connection.query(
    'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [decrementAmount, id, decrementAmount],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating stock' });
      }
      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Not enough stock or invalid product ID' });
      }
      res.json({ message: 'Stock updated successfully' });
    }
  );
});


// öka lagerstatus
app.patch('/products/:id/incrementStock', (req, res) => {
  const { id } = req.params;
  const incrementAmount = req.body.amount || 1; // ökar med en 

  connection.query(
    'UPDATE products SET stock = stock + ? WHERE id = ?',
    [incrementAmount, id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating stock' });
      }
      res.json({ message: 'Stock restored successfully' });
    }
  );
});

// admin kan uppdatera produkter
app.patch('/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;

  const query = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?';
  const values = [name, description, price, stock, id];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Fel vid uppdatering av produkt.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Produkten hittades inte.' });
    }
    res.status(200).json({ message: 'Produkten har uppdaterats!' });
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

//hämta kommentarer
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
