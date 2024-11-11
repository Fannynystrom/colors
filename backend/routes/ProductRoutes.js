import express from 'express';
import multer from 'multer';
import path from 'path';
import connection from '../db.js';
import sharp from 'sharp';
import fs from 'fs';
import { authenticateToken, authorizeRoles } from '../authMiddleware.js'; 

const router = express.Router();

// multer för bilduppladdning med filbegränsning
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // filnamn med tidsstämpel
  },
});

// filtypkontroll för att endast tillåta png, jpg, och jpeg
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); 
  } else {
    cb(new Error('Endast PNG, JPG och JPEG-bilder är tillåtna!'), false); 
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  // begränsar storleken till 5 MB
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// bildbearbetning med sharp, kontrollerar att bilden är vad den utger sig för att vara
const processImage = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const processedPath = filePath.replace(/(\.[\w\d_-]+)$/i, '_processed$1');

  const image = sharp(filePath).resize({ width: 800 });

  try {
    // kollar att filen är en riktig bild innan den sparas i databasen
    await image.metadata();
  } catch (error) {
    // om de inte skulle vara en giltlig bild, raderas den och skickar ett fel
    fs.unlinkSync(filePath);
    throw new Error("Invalid image file.");
  }

  // Konvertera endast till JPEG om filen inte är PNG
  if (extension !== '.png') {
    await image.toFormat('jpeg').jpeg({ quality: 80, force: true }).toFile(processedPath);
  } else {
    await image.toFile(processedPath); 
  }

  fs.unlinkSync(filePath); // tar bort originalfilen med metadata, sparar lagringsutrymme
  return processedPath;
};

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

// skapa en ny kommentar 
router.post('/:productId/comments', (req, res) => {
  const { productId } = req.params;
  const { text, name } = req.body;

  connection.query(
    'INSERT INTO comments (productId, text, name, created_at) VALUES (?, ?, ?, NOW())',
    [productId, text, name],
    (err, results) => {
      if (err) {
        return res.status(500).send('Error saving comment');
      }
      res.status(201).json({ id: results.insertId, productId, text, name, created_at: new Date() });
    }
  );
});

// hämta kommentarer för produkt
router.get('/:productId/comments', (req, res) => {
  const { productId } = req.params;

  connection.query(
    'SELECT id, productId, text, name, created_at FROM comments WHERE productId = ?',
    [productId],
    (err, results) => {
      if (err) {
        return res.status(500).send('Error fetching comments');
      }
      res.json(results);
    }
  );
});

// skapa en ny produkt (endast för admin)
router.post('/', authenticateToken, authorizeRoles('admin'), upload.single('image'), async (req, res) => {
  const { name, description, price, stock } = req.body;
  let imageUrl = null;

  if (req.file) {
    try {
      imageUrl = await processImage(req.file.path); // Bearbeta bilden
      imageUrl = imageUrl.replace('uploads/', '/uploads/');
    } catch (error) {
      console.error('Bildbehandling misslyckades:', error);
      return res.status(500).json({ error: 'Fel vid bildbehandling.' });
    }
  }

  try {
    const [result] = await connection.promise().query(
      'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, imageUrl]
    );

    res.status(201).json({ message: 'Produkt skapad!', productId: result.insertId, imageUrl });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Fel vid skapande av produkt.' });
  }
});

// uppdatera en produkt med möjlighet att ändra bild (endast för admin)
router.patch('/:id', authenticateToken, authorizeRoles('admin'), upload.single('image'), (req, res) => {
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

// ta bort en produkt (endast för admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
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
