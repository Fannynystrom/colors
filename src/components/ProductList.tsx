import React from 'react';
import { FaEdit } from 'react-icons/fa'; 

interface ProductListProps {
  products: any[];
  isAdmin: boolean;
  cartItems: CartItem[];
  handleProductClick: (product: any) => void;
  handleRemoveFromCart: (productId: number, quantity?: number) => void;
  handleAddToCart: (product: any) => void;
  openEditModal: (product: any) => void;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isAdmin,
  cartItems,
  handleProductClick,
  handleRemoveFromCart,
  handleAddToCart,
  openEditModal,
}) => {
  const cartQuantities: { [productId: number]: number } = {};
  cartItems.forEach(item => {
    cartQuantities[item.id] = item.quantity;
  });

  return (
    <div>
      <h2>Produkter</h2>
      <ul>
        {products.map(product => (
          <li key={product.id} onClick={() => handleProductClick(product)}>
            {isAdmin && (
              <FaEdit 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  openEditModal(product); 
                }} 
                style={{ cursor: 'pointer', float: 'right', fontSize: '1.3em' }} 
              />
            )}
            {/* Visa produktbild om den finns */}
            {product.image_url ? (
              <img 
                src={`http://localhost:3001${product.image_url}`} 
                alt={product.name} 
                className="product-image" 
              />
            ) : (
              <p>No image available</p> // visar en fallback-text om bilden saknas
            )}

            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>Pris: {product.price} kr</p>
            {cartQuantities[product.id] ? (
              <div className="quantity-control">
                <button onClick={(e) => { 
                  e.stopPropagation(); 
                  handleRemoveFromCart(product.id, 1); 
                }}>-</button>
                <span>{cartQuantities[product.id]}</span>
                <button onClick={(e) => { 
                  e.stopPropagation(); 
                  handleAddToCart(product); 
                }}>+</button>
              </div>
            ) : (
              <button onClick={(e) => { 
                e.stopPropagation(); 
                handleAddToCart(product); 
              }}>Lägg till i varukorg</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
