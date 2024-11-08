import express from 'express';
import connection from '../db.js';

const router = express.Router();

// hämtar alla produkter
router.get('/', (req, res) => {
    connection.query('SELECT id, name, description, price, stock, image_url FROM products', (err, results) => {
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
      const [result] = await connection.promise().query(
        'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
        [name, description, price, stock]
      );
  
      // skickar tillbaka productId till frontend
      res.status(201).json({ message: 'Produkt skapad!', productId: result.insertId });
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
  
    connection.query(
      'UPDATE products SET stock = stock - ?, reserved_stock = reserved_stock + ? WHERE id = ? AND stock >= ?',
      [reserveAmount, reserveAmount, id, reserveAmount],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Error reserving stock' });
        }
        if (result.affectedRows === 0) {
          return res.status(400).json({ error: 'Not enough stock or invalid product ID' });
        }
        res.json({ message: 'Product reserved successfully' });
      }
    );
  });

  //återgå till stock asså lagerstatus
  router.patch('/:id/release', (req, res) => {
    const { id } = req.params;
    const releaseAmount = req.body.amount || 1;
  
    connection.query(
      'UPDATE products SET stock = stock + ?, reserved_stock = reserved_stock - ? WHERE id = ? AND reserved_stock >= ?',
      [releaseAmount, releaseAmount, id, releaseAmount],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Error releasing stock' });
        }
        if (result.affectedRows === 0) {
          return res.status(400).json({ error: 'No reserved stock or invalid product ID' });
        }
        res.json({ message: 'Product released successfully' });
      }
    );
  });
  
  
  
  export default router;
