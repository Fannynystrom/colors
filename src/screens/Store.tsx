import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { AuthContext } from '../context/AuthContext';
import '../../src/styles/store/ModalAdminStyles.css';
import '../../src/styles/store/ModalProductsStyles.css';
import '../../src/styles/store/Shop.css';
import CommentsSection from '../components/CommentSection';

Modal.setAppElement('#root');

const Store: React.FC = () => {
  const authContext = useContext(AuthContext);
  const isAdmin = authContext?.role === 'admin';

  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number | ''>('');
  const [products, setProducts] = useState<Array<any>>([]);
  const [cartQuantities, setCartQuantities] = useState<{ [productId: number]: number }>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
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

  // uppdaterar totalt antal produkter i varukorgen och värdet sitter i AuthContext
  const updateCartTotalCount = () => {
    const totalCount = Object.values(cartQuantities).reduce((total, quantity) => total + quantity, 0);
    authContext?.setCartTotalCount(totalCount); // uppdaterar värdet i AuthContext
  };

  // uppdaterar cartItems i AuthContext baserat på cartQuantities
  const updateCartItems = () => {
    const items = Object.entries(cartQuantities).map(([productId, quantity]) => {
      const product = products.find(p => p.id === Number(productId));
      return { id: product.id, name: product.name, price: product.price, quantity };
    });
    authContext?.setCartItems(items);
  };

  const handleAddToCart = (product: any) => {
    setCartQuantities(prev => {
      const newQuantities = { ...prev, [product.id]: (prev[product.id] || 0) + 1 };
      return newQuantities;
    });
  };

  const handleIncreaseQuantity = (productId: number) => {
    setCartQuantities(prev => {
      const newQuantities = { ...prev, [productId]: prev[productId] + 1 };
      return newQuantities;
    });
  };

  const handleDecreaseQuantity = (productId: number) => {
    setCartQuantities(prev => {
      const newQuantities = { ...prev };
      if (newQuantities[productId] > 1) {
        newQuantities[productId] -= 1;
      } else {
        delete newQuantities[productId];
      }
      return newQuantities;
    });
  };

  // anropar updateCartTotalCount och updateCartItems varje gång cartQuantities ändras
  useEffect(() => {
    updateCartTotalCount();
    updateCartItems();
  }, [cartQuantities]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const productData = { name, description, price };

    try {
      const response = await fetch('http://localhost:3001/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const updatedResponse = await fetch('http://localhost:3001/products');
        const updatedData = await updatedResponse.json();
        setProducts(updatedData);
        setModalIsOpen(false);
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
    setSelectedProduct(product);
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
              {cartQuantities[product.id] ? (
                <div>
                  <button onClick={(e) => { e.stopPropagation(); handleDecreaseQuantity(product.id); }}>-</button>
                  <span>{cartQuantities[product.id]}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleIncreaseQuantity(product.id); }}>+</button>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}>Lägg till i varukorg</button>
              )}
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
            {cartQuantities[selectedProduct.id] ? (
              <div>
                <button onClick={() => handleDecreaseQuantity(selectedProduct.id)}>-</button>
                <span>{cartQuantities[selectedProduct.id]}</span>
                <button onClick={() => handleIncreaseQuantity(selectedProduct.id)}>+</button>
              </div>
            ) : (
              <button onClick={() => handleAddToCart(selectedProduct)}>Lägg till i varukorg</button>
            )}
            
            {/* kommentarer */}
            <CommentsSection productId={selectedProduct.id} />
            <button onClick={() => setSelectedProduct(null)}>Stäng</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Store;
