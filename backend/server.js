import express from 'express';
import connection from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors'; 

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors()); 
app.use(express.json());


app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // hashar lösenordet INNAN de sparas
  const hashedPassword = await bcrypt.hash(password, 10);

  // alla användare som skapas blir users
  connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'user'], (err, results) => {
    if (err) {
      return res.status(500).send('Registrering misslyckades.');
    }

    res.status(201).send('Användare skapad!');
  });
});

  
// Route för inloggning
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).send('Server error.');
    }

    if (results.length === 0) {
      return res.status(401).send('Felaktigt användarnamn eller lösenord.');
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) {
        return res.status(401).send('Felaktigt användarnamn eller lösenord.');
      }

      
      res.json({ message: 'Inloggning lyckades!', userId: user.id, role: user.role }); 
    });
  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
