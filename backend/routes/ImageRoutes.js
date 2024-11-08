import express from 'express';
import multer from 'multer';
import path from 'path';
import connection from '../db.js';

const router = express.Router();

//  multer för att spara bilder
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

//  bild för en specifik produkt
router.post('/:productId', upload.single('image'), (req, res) => {
  const { productId } = req.params;
  const image_url = `/uploads/${req.file.filename}`;

  // uppdatera produktens bild-URL i databasen
  connection.query(
    'UPDATE products SET image_url = ? WHERE id = ?',
    [image_url, productId],
    (err, result) => {
      if (err) {
        console.error('Error updating product with image:', err);
        return res.status(500).json({ error: 'Failed to update product image' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Produkten hittades inte' });
      }
      res.status(200).json({ message: 'Bild uppladdad och kopplad till produkt!', imageUrl: image_url });
    }
  );
});

export default router;
