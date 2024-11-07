import React, { useContext, useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import { AuthContext } from '../context/AuthContext';
import '../../src/styles/store/ModalAdminStyles.css';
import '../../src/styles/store/ModalProductsStyles.css';
import '../../src/styles/store/Shop.css';
import CommentsSection from '../components/CommentSection';
import ProductList from '../components/ProductList';
import ProductModal from '../components/ProductModal';
import { FaEdit } from 'react-icons/fa';

Modal.setAppElement('#root');

const Store: React.FC = () => {
  const authContext = useContext(AuthContext);
  const isAdmin = authContext?.role === 'admin';

  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<number | ''>('');
  const [products, setProducts] = useState<Array<any>>([]);
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

  // lägg till en produkt i varukorgen och minska lagersaldot
  const handleAddToCart = async (product: any) => {
    if (!authContext) return;
  
    // Kontrollera att det finns tillräckligt med lager innan reservation
    const availableStock = product.stock - product.reserved_stock;
    if (availableStock <= 0) {
      alert('Inte tillräckligt med lager.');
      return;
    }
  
    // Lägg till i varukorgen via AuthContext
    authContext.addToCart(product);
  
    try {
      const response = await fetch(`http://localhost:3001/products/${product.id}/reserve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 1 }),
      });
  
      if (response.ok) {
        const updatedResponse = await fetch('http://localhost:3001/products');
        const updatedData = await updatedResponse.json();
        setProducts(updatedData); // Uppdatera produkterna i frontend
        console.log(`Product ID ${product.id} has been reserved`);
      } else {
        console.error('Failed to reserve stock');
      }
    } catch (error) {
      console.error('Error reserving stock:', error);
    }
  };
  

  // tar bort en produkt från varukorgen och ökar lagersaldot
  const handleRemoveFromCart = async (productId: number, quantity: number = 1) => {
    if (!authContext) return;
  
    // ta bort från varukorgen via AuthContext
    await authContext.removeFromCart(productId, quantity);
  
    // öka lagersaldot på servern
    try {
      const response = await fetch(`http://localhost:3001/products/${productId}/incrementStock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: quantity }),
      });
  
      if (response.ok) {
        const data = await response.json();
        setProducts(prevProducts =>
          prevProducts.map(p => (p.id === productId ? { ...p, stock: data.stock } : p))
        );
        clearTimeout(reservationTimers.current[productId]);
        console.log(`Ökat lagersaldo för produkt ID ${productId} med ${quantity}`);
      } else {
        const errorData = await response.json();
        console.error('Misslyckades med att öka lagersaldo:', errorData.error);
      }
    } catch (error) {
      console.error('Fel vid ökning av lagersaldo:', error);
    }
  };
  
  

  // timer för att automatiskt ta bort reserverade produkter
  const startReservationTimer = (productId: number) => {
    clearTimeout(reservationTimers.current[productId]);
  
    reservationTimers.current[productId] = setTimeout(async () => {
      await handleRemoveFromCart(productId);
    }, 60000); // 1 minut
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

  // produktuppdatering vid redigering
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
        setProducts(prevProducts =>
          prevProducts.map(p => (p.id === editProduct.id ? { ...p, ...updatedProduct } : p))
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

  // Skapa en ny produkt
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

  // radera produkt
  const handleDeleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // uppdatera produktlistan lokalt
        setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
        setEditModalIsOpen(false);
        setEditProduct(null);
      } else {
        console.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="shop">
      <img src={`${process.env.PUBLIC_URL}/målarrubrik.png`} alt="Butik Rubrik" style={{ width: '90%', height: 'auto' }} />

      <h1>Butik</h1>
      {isAdmin && (
        <button onClick={() => setModalIsOpen(true)}>Lägg till produkt</button>
      )}

      {/* Modal för att lägga till produkt (admin) */}
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
            onChange={(e) => {
              const inputValue = e.target.value;
              setPrice(inputValue === '' ? '' : Math.max(0, Number(inputValue)));
            }}
            min="0"
            required
          />
          <input
            type="number"
            placeholder="Lagerstatus"
            value={stock}
            onChange={(e) => {
              const inputValue = e.target.value;
              setStock(inputValue === '' ? '' : Math.max(0, Number(inputValue)));
            }}
            min="0"
            required
          />
          <button type="submit">Skapa produkt</button>
        </form>
        <button onClick={() => setModalIsOpen(false)}>Stäng</button>
      </Modal>

      {/* Listan med produkter */}
      <ProductList
        products={products}
        isAdmin={isAdmin}
        cartItems={authContext?.cartItems || []}
        handleProductClick={handleProductClick}
        handleRemoveFromCart={handleRemoveFromCart}
        handleAddToCart={handleAddToCart}
        openEditModal={openEditModal}
      />

      {/* Modal för vald produkt */}
      <ProductModal
        isOpen={!!selectedProduct}
        onRequestClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        cartItems={authContext?.cartItems || []}
        handleRemoveFromCart={handleRemoveFromCart}
        handleAddToCart={handleAddToCart}
      />

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
            onChange={(e) => {
              const inputValue = e.target.value;
              setPrice(inputValue === '' ? '' : Math.max(0, Number(inputValue)));
            }}
            min="0"
            required
          />
          <input
            type="number"
            placeholder="Lagerstatus"
            value={stock}
            onChange={(e) => {
              const inputValue = e.target.value;
              setStock(inputValue === '' ? '' : Math.max(0, Number(inputValue)));
            }}
            min="0"
            required
          />
          <button type="submit">Spara ändringar</button>
        </form>

        {/* Ta bort produkt */}
        <button 
          onClick={() => handleDeleteProduct(editProduct.id)} 
          style={{ color: 'red', marginTop: '10px' }}
        >
          Ta bort produkt
        </button>
        <button onClick={() => setEditModalIsOpen(false)}>Stäng</button>
      </Modal>
    </div>
  );
};

export default Store;
