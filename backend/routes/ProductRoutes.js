import express from 'express';
import multer from 'multer';
import path from 'path';
import connection from '../db.js';

const router = express.Router();

//  `multer` för bilduppladdning
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // filnamn med tidsstämpel
  },
});
const upload = multer({ storage });

// hämta alla produkter
router.get('/', (req, res) => {
  connection.query('SELECT id, name, description, price, stock, image_url FROM products', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(results);
  });
});

// skapa en ny produkt
router.post('/', upload.single('image'), async (req, res) => {
    const { name, description, price, stock } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
    try {
      const [result] = await connection.promise().query(
        'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, stock, image_url]
      );
  
      // skickar tillbaka produktens ID och bild-URL till frontend
      res.status(201).json({ message: 'Produkt skapad!', productId: result.insertId, imageUrl: image_url });
    } catch (err) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Fel vid skapande av produkt.' });
    }
  });
  

// uppdatera en produkt med möjlighet att ändra bild
router.patch('/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    console.log("Mottagna data:", { id, name, description, price, stock, image_url }); // Logga mottagna data

    // uppdaterar produkten i databasen
    const updateProduct = (finalImageUrl) => {
      const query = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?';
      const values = [name, description, price, stock, finalImageUrl, id];

      connection.query(query, values, (error, results) => {
        if (error) {
          console.error('Error updating product:', error);
          return res.status(500).json({ error: 'Fel vid uppdatering av produkt.' });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Produkten hittades inte.' });
        }
        res.status(200).json({ message: 'Produkten har uppdaterats!', imageUrl: finalImageUrl });
      });
    };

    // om ingen ny bild laddas upp, behålls den gamla bilden
    if (!image_url) {
      connection.query('SELECT image_url FROM products WHERE id = ?', [id], (err, results) => {
        if (err || results.length === 0) {
          console.error('Error retrieving existing image_url:', err);
          return res.status(500).json({ error: 'Failed to retrieve product image' });
        }
        updateProduct(results[0].image_url); 
      });
    } else {
      updateProduct(image_url); 
    }
});


  

// tar bort en produkt
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

// återgå till stock
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
