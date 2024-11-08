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
  const [image, setImage] = useState<File | null>(null); 

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

  //  handleAddToCart asynkron
  const handleAddToCart = async (product: any) => {
    if (!authContext) return;
  
    // beräkna den totala mängden i varukorgen
    const totalCartQuantity = authContext.cartItems.reduce((total, item) => total + item.quantity, 0);
  
    // om vi redan har fem eller fler produkter, visa en varning
    if (totalCartQuantity >= 5) {
      alert("Tyvärr kan du endast välja 5 produkter totalt åt gången.");
      return;
    }
  
    await authContext.addToCart(product);
  };
  

  // handleRemoveFromCart asynkron
  const handleRemoveFromCart = async (productId: number, quantity: number = 1) => {
    if (authContext) {
      await authContext.removeFromCart(productId, quantity);
    }
  };

  const startReservationTimer = (productId: number) => {
    clearTimeout(reservationTimers.current[productId]);
    reservationTimers.current[productId] = setTimeout(() => {
      handleRemoveFromCart(productId);
    }, 60000); // 1 minut
  };

  const openEditModal = (product: any) => {
    setEditProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price);
    setStock(product.stock);
    setEditModalIsOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editProduct) return;
  
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price.toString());
    formData.append('stock', stock.toString());
    if (image) {
      formData.append('image', image); // Bifoga ny bild om den finns
    }
  
    try {
      const response = await fetch(`http://localhost:3001/products/${editProduct.id}`, {
        method: 'PATCH',
        body: formData,
      });
  
      if (response.ok) {
        const updatedResponse = await fetch('http://localhost:3001/products');
        const updatedData = await updatedResponse.json();
        setProducts(updatedData);
        setEditModalIsOpen(false);
        setEditProduct(null);
        setImage(null); // Rensa bilden
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };
  
  
  
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price.toString());
    formData.append('stock', stock.toString());
    if (image) {
      formData.append('image', image); 
    }
  
    try {
      const response = await fetch('http://localhost:3001/products', {
        method: 'POST',
        body: formData, 
      });
  
      if (response.ok) {
        //rensar alla fält när de skickats och stänger modalen vid skickande
        const updatedResponse = await fetch('http://localhost:3001/products');
        const updatedData = await updatedResponse.json();
        setProducts(updatedData);
        setModalIsOpen(false);
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
        setImage(null); 
      } else {
        console.error('Failed to create product');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  
  

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };
  

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
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

  // säkerställer att fälten är tomma när admin öppnar för att skapa produkt
  const openAddProductModal = () => {
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setModalIsOpen(true);
  };

  //  rensa fälten i skapa produkt när modalen stängs
  useEffect(() => {
    if (!modalIsOpen) {
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
    }
  }, [modalIsOpen]);

  return (
    <div className="shop">
      {/* video-element för rubriken */}
      <video
        className="header-video" 
        src={`${process.env.PUBLIC_URL}/storeheader.mp4`}  
        autoPlay
        loop
        muted
        style={{ width: '100%', height: 'auto' }}
      />
      <h1>Butik</h1>
      {isAdmin && (
        <button onClick={openAddProductModal}>Lägg till produkt</button>
      )}

      {/* modal för att lägga till produkt */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="admin-add-product-modal"
      >
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
          <input type="file" onChange={handleImageChange} />
          <button type="submit">Skapa produkt</button>
        </form>
        <button onClick={() => setModalIsOpen(false)}>Stäng</button>
      </Modal>

      <ProductList
        products={products}
        isAdmin={isAdmin}
        cartItems={authContext?.cartItems || []}
        handleProductClick={handleProductClick}
        handleRemoveFromCart={handleRemoveFromCart}
        handleAddToCart={handleAddToCart}
        openEditModal={openEditModal}
      />

      <ProductModal
        isOpen={!!selectedProduct}
        onRequestClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        cartItems={authContext?.cartItems || []}
        handleRemoveFromCart={handleRemoveFromCart}
        handleAddToCart={handleAddToCart}
      />


      {/* redigeringsmodal admin */}
      <Modal
        isOpen={editModalIsOpen}
        onRequestClose={() => setEditModalIsOpen(false)}
        className="admin-add-product-modal"
      >
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
                    <input type="file" onChange={handleImageChange} />

          <button type="submit">Spara ändringar</button>
        </form>
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
