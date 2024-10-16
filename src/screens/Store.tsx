import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { AuthContext } from '../context/AuthContext';

// Sätt modal root element
Modal.setAppElement('#root');

const Store: React.FC = () => {
  const authContext = useContext(AuthContext);
  const isAdmin = authContext?.role === 'admin';

  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number | ''>('');
  const [products, setProducts] = useState<Array<any>>([]); // state för produkter

  useEffect(() => {
    // Hämta produkter från servern
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3001/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts(); // Anropa funktionen för att hämta produkter
  }, []); 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const productData = { name, description, price };
    console.log('Submitting product:', productData); // Loggningen
  
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
        // Hämta produkter igen för att uppdatera listan
        const updatedResponse = await fetch('http://localhost:3001/products');
        const updatedData = await updatedResponse.json();
        setProducts(updatedData); // Uppdatera produkterna i state
        setModalIsOpen(false); // Stäng modal efter skapande
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

  return (
    <div>
      <img src={`${process.env.PUBLIC_URL}/målarrubrik.png`} alt="Butik Rubrik" style={{ width: '90%', height: 'auto' }} />
      
      <h1>Butik</h1>
      {isAdmin && (
        <button onClick={() => setModalIsOpen(true)}>Lägg till produkt</button>
      )}

      {/* Modalen för att lägga till produkt */}
      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)}>
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

      {/* Listan med produkter */}
      <div>
        <h2>Produkter</h2>
        <ul>
          {products.map(product => (
            <li key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>Pris: {product.price} kr</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Store;
