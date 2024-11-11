//för adminpage 

import express from 'express';
import connection from '../db.js'; 

const router = express.Router();

// hämta alla användare
router.get('/users', (req, res) => {
  connection.query('SELECT id, username, role FROM users', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(results);
  });
});

//  uppdaterar en användares roll
router.patch('/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // kollar att rollen är giltig
  const validRoles = ['user', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Ogiltig roll.' });
  }

  connection.query('UPDATE users SET role = ? WHERE id = ?', [role, id], (err, results) => {
    if (err) {
      console.error('Error updating user role:', err);
      return res.status(500).json({ error: 'Failed to update user role' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Användaren hittades inte.' });
    }
    res.json({ message: 'Användarens roll uppdaterades framgångsrikt.' });
  });
});

// hämtar inloggningsloggar
router.get('/login-logs', (req, res) => {
  const query = `
    SELECT id, timestamp, username, ip_address, user_agent, success
    FROM login_logs
    ORDER BY timestamp DESC
    LIMIT 100
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching login logs:', err);
      return res.status(500).json({ error: 'Failed to fetch login logs' });
    }
    res.json(results);
  });
});

export default router;
