import express from 'express';
import connection from '../db.js';

const router = express.Router();

// hämtar alla produkter
router.get('/', (req, res) => {
  connection.query('SELECT id, name, description, price FROM products', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(results);
  });
});

// skapar en ny produkt
router.post('/', async (req, res) => {
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

// uppdatera en produkt
router.patch('/:id', (req, res) => {
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

// ta bort en produkt
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  connection.query('DELETE FROM products WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ error: 'Fel vid borttagning av produkt.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Produkten hittades inte.' });
    }
    res.status(200).json({ message: 'Produkten har tagits bort!' });
  });
});

// reservera en produkt
router.patch('/:id/reserve', (req, res) => {
  const { id } = req.params;
  const reserveAmount = req.body.amount || 1;

  connection.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: 'Fel vid start av transaktion' });

    connection.query(
      'UPDATE products SET stock = stock - ?, reserved_stock = reserved_stock + ? WHERE id = ? AND stock >= ?',
      [reserveAmount, reserveAmount, id, reserveAmount],
      (updateErr, result) => {
        if (updateErr) {
          return connection.rollback(() => {
            res.status(500).json({ error: 'Fel vid reservation av lagersaldo' });
          });
        }

        if (result.affectedRows === 0) {
          return connection.rollback(() => {
            res.status(400).json({ error: 'Otillräckligt lagersaldo eller ogiltigt produkt-ID' });
          });
        }

        connection.commit((commitErr) => {
          if (commitErr) {
            return connection.rollback(() => {
              res.status(500).json({ error: 'Fel vid commit av transaktion' });
            });
          }
          console.log(`Product ID ${id} stock decreased by ${reserveAmount} and reserved_stock increased by ${reserveAmount}`);
          res.json({ message: 'Produkten har reserverats' });
        });
      }
    );
  });
});

// släpp en reserverad produkt
router.patch('/:id/release', (req, res) => {
  const { id } = req.params;
  const releaseAmount = req.body.amount || 1;

  connection.query(
    'UPDATE products SET stock = stock + ?, reserved_stock = reserved_stock - ? WHERE id = ? AND reserved_stock >= ?',
    [releaseAmount, releaseAmount, id, releaseAmount],
    (err, result) => {
      if (err) {
        console.error('Fel vid återställning av lagersaldo:', err);
        return res.status(500).json({ error: 'Fel vid återställning av lagersaldo' });
      }
      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Inget reserverat lager eller ogiltigt produkt-ID' });
      }

      console.log(`Product ID ${id} stock increased by ${releaseAmount} and reserved_stock decreased by ${releaseAmount}`);
      res.json({ message: 'Produkten har återställts till lager' });
    }
  );
});

export default router;
