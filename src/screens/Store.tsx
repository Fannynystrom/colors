import React, { useContext, useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import { AuthContext } from '../context/AuthContext';
import '../../src/styles/store/ModalAdminStyles.css';
import '../../src/styles/store/ModalProductsStyles.css';
import '../../src/styles/store/Shop.css';
import CommentsSection from '../components/CommentSection';
import { FaEdit } from 'react-icons/fa'; // Lägg till för redigeringspennan

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
  const [stock, setStock] = useState<number | ''>('');
  const [editModalIsOpen, setEditModalIsOpen] = useState<boolean>(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const reservationTimers = useRef<{ [productId: number]: NodeJS.Timeout }>({});

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
    authContext?.setCartTotalCount(totalCount);
  };

  // uppdaterar cartItems i AuthContext baserat på cartQuantities
  const updateCartItems = () => {
    const items = Object.entries(cartQuantities).map(([productId, quantity]) => {
      const product = products.find((p) => p.id === Number(productId));
      return { id: product.id, name: product.name, price: product.price, quantity };
    });
    authContext?.setCartItems(items);
  };

  // redigeringsmodalen 
  const openEditModal = (product: any) => {
    setEditProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price);
    setStock(product.stock);
    setEditModalIsOpen(true);
  };

  // Produktuppdatering vid redigering
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    const updatedProduct = { name, description, price, stock };
    try {
      const response = await fetch(`http://localhost:3001/products/${editProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === editProduct.id ? { ...p, ...updatedProduct } : p))
        );
        setEditModalIsOpen(false);
        setEditProduct(null);
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  //lägger till i varukorg
  const handleAddToCart = async (product: any) => {
    const newQuantity = (cartQuantities[product.id] || 0) + 1;

    if (product.stock >= newQuantity) {
      setCartQuantities((prev) => {
        const newQuantities = { ...prev, [product.id]: newQuantity };
        return newQuantities;
      });

      try {
        // minska lagret på servern med endast den senaste ökningen
        const response = await fetch(`http://localhost:3001/products/${product.id}/decrementStock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: 1 }), // Minskar lagret med 1 för varje klick
        });

        if (response.ok) {
          setProducts((prevProducts) =>
            prevProducts.map((p) => (p.id === product.id ? { ...p, stock: p.stock - 1 } : p))
          );
          startReservationTimer(product.id); // Startar timer för reservation
        } else {
          console.error('Failed to decrement stock');
        }
      } catch (error) {
        console.error('Error decrementing stock:', error);
      }
    } else {
      alert('Inte tillräckligt med lager.');
    }
  };

  // Timer för att automatiskt ta bort reserverade produkter
  const startReservationTimer = (productId: number) => {
    clearTimeout(reservationTimers.current[productId]);

    reservationTimers.current[productId] = setTimeout(() => {
      handleRemoveReservation(productId);
    }, 60000); // 1 minut
  };

  const handleRemoveReservation = (productId: number) => {
    const quantity = cartQuantities[productId];
    if (quantity) {
      handleDecreaseQuantity(productId, quantity); // Återställ tillgänglig lagernivå
    }
  };

  // Ökar produktantal i varukorg och snackar med servern om de
  const handleIncreaseQuantity = async (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && product.stock > (cartQuantities[productId] || 0)) {
      setCartQuantities((prev) => {
        const newQuantities = { ...prev, [productId]: (prev[productId] || 0) + 1 };
        return newQuantities;
      });

      try {
        // minskar lagret på servern med 1 eftersom vi lägger till en produkt
        const response = await fetch(`http://localhost:3001/products/${productId}/decrementStock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: 1 }),
        });

        if (response.ok) {
          setProducts((prevProducts) =>
            prevProducts.map((p) => (p.id === productId ? { ...p, stock: p.stock - 1 } : p))
          );
          startReservationTimer(productId); // Startar timer vid varje ökning
        } else {
          console.error('Failed to decrement stock');
        }
      } catch (error) {
        console.error('Error decrementing stock:', error);
      }
    } else {
      alert('Inte tillräckligt med lager.');
    }
  };

  // handleDecreaseQuantity ökar/minskar och snackar med servern om de
  const handleDecreaseQuantity = async (productId: number, decrementBy = 1) => {
    if (cartQuantities[productId] > 0) {
      setCartQuantities((prev) => {
        const newQuantities = { ...prev };
        newQuantities[productId] -= decrementBy;
        if (newQuantities[productId] <= 0) {
          delete newQuantities[productId];
        }
        return newQuantities;
      });

      try {
        // ökar lagret på servern med 1 eftersom vi tar bort en produkt från varukorgen
        const response = await fetch(`http://localhost:3001/products/${productId}/incrementStock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: decrementBy }),
        });

        if (response.ok) {
          setProducts((prevProducts) =>
            prevProducts.map((p) => (p.id === productId ? { ...p, stock: p.stock + decrementBy } : p))
          );
          clearTimeout(reservationTimers.current[productId]); // Stoppar timern vid minskning
        } else {
          console.error('Failed to increment stock');
        }
      } catch (error) {
        console.error('Error incrementing stock:', error);
      }
    }
  };

  // Anropar updateCartTotalCount och updateCartItems varje gång cartQuantities ändras
  useEffect(() => {
    updateCartTotalCount();
    updateCartItems();
  }, [cartQuantities]);

  //  återställer lagersaldo för varukorgens produkter
  const resetCartStock = async () => {
    for (const [productId, quantity] of Object.entries(cartQuantities)) {
      if (quantity > 0) {
        try {
          await fetch(`http://localhost:3001/products/${productId}/incrementStock`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: quantity }),
          });
        } catch (error) {
          console.error('Error resetting stock for product:', productId);
        }
      }
    }
    setCartQuantities({});
  };

  // anropar resetCartStock vid utloggning eller när komponenten avmonteras
  useEffect(() => {
    return () => {
      resetCartStock();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const productData = { name, description, price, stock };

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
        setStock('');
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
          <input
           type="number"
           placeholder="Lagerstatus"
           value={stock}
           onChange={(e) => setStock(Number(e.target.value))}
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
              <p>Lagerstatus: {product.stock} st</p>
              {cartQuantities[product.id] ? (
                <div>
                  <button onClick={(e) => { e.stopPropagation(); handleDecreaseQuantity(product.id); }}>-</button>
                  <span>{cartQuantities[product.id]}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleIncreaseQuantity(product.id); }}>+</button>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}>Lägg till i varukorg</button>
              )}
              
              {/* Redigeringsikon för admin */}
              {isAdmin && (
                <FaEdit onClick={(e) => { e.stopPropagation(); openEditModal(product); }} style={{ cursor: 'pointer' }} />
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
            <p>Lagerstatus: {selectedProduct.stock} st</p>
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

      {/* Redigeringsmodal för admin */}
      <Modal isOpen={editModalIsOpen} onRequestClose={() => setEditModalIsOpen(false)} className="admin-add-product-modal">
        <h2>Redigera produkt</h2>
        <form onSubmit={handleUpdateProduct}>
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
          <input
            type="number"
            placeholder="Lagerstatus"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            required
          />
          <button type="submit">Spara ändringar</button>
        </form>
        <button onClick={() => setEditModalIsOpen(false)}>Stäng</button>
      </Modal>
    </div>
  );
};

export default Store;
