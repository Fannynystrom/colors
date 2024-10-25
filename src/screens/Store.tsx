import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { AuthContext } from '../context/AuthContext';
import '../../src/styles/store/ModalAdminStyles.css';
import '../../src/styles/store/ModalProductsStyles.css';
import '../../src/styles/store/Shop.css';
import CommentsSection from '../components/CommentSection'; 

// modal som root element
Modal.setAppElement('#root');

const Store: React.FC = () => {
  const authContext = useContext(AuthContext);
  const isAdmin = authContext?.role === 'admin';

  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number | ''>('');
  const [products, setProducts] = useState<Array<any>>([]); // state för produkter

  const [selectedProduct, setSelectedProduct] = useState<any>(null); // state för vald produkt
  const [comments, setComments] = useState<{ productId: number; text: string }[]>([]); // state för kommentarer

  useEffect(() => {
    // hämtar produkter från servern
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3001/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const productData = { name, description, price };
    console.log('Submitting product:', productData); // loggning

    try {
      const response = await fetch('http://localhost:3001/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        console.log('Product created successfully');
        // hämtar produkterna igen för att uppdatera listan
        const updatedResponse = await fetch('http://localhost:3001/products');
        const updatedData = await updatedResponse.json();
        setProducts(updatedData); // uppdaterar produkterna
        setModalIsOpen(false); // stänger modal efter skapande
        setName('');
        setDescription('');
        setPrice('');
      } else {
        console.error('Failed to create product:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product); // den klickade produkten som vald produkt
  };

  const addComment = (newComment: { productId: number; text: string }) => {
    setComments([...comments, newComment]);
  };

  return (
    <div className="shop">
      <img src={`${process.env.PUBLIC_URL}/målarrubrik.png`} alt="Butik Rubrik" style={{ width: '90%', height: 'auto' }} />

      <h1>Butik</h1>
      {isAdmin && (
        <button onClick={() => setModalIsOpen(true)}>Lägg till produkt</button>
      )}

      {/* modal för att lägga till produkt (admin) */}
      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} className="admin-add-product-modal">
        <h2>Lägg till produkt</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Namn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Beskrivning"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Pris"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
          />
          <button type="submit">Skapa produkt</button>
        </form>
        <button onClick={() => setModalIsOpen(false)}>Stäng</button>
      </Modal>

      {/* listan med produkter */}
      <div>
        <h2>Produkter</h2>
        <ul>
          {products.map(product => (
            <li key={product.id} onClick={() => handleProductClick(product)}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>Pris: {product.price} kr</p>
            </li>
          ))}
        </ul>
      </div>

      {/* modal för vald produkt */}
      <Modal isOpen={!!selectedProduct} onRequestClose={() => setSelectedProduct(null)} className="product-details-modal">
        {selectedProduct && (
          <div>
            <h2>{selectedProduct.name}</h2>
            <p>{selectedProduct.description}</p>
            <p>Pris: {selectedProduct.price} kr</p>

            {/* kommentarer */}
            <CommentsSection
              productId={selectedProduct.id}
              comments={comments}
              onAddComment={addComment}
            />

            <button onClick={() => setSelectedProduct(null)}>Stäng</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Store;
