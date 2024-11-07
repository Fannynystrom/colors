// src/components/ProductModal.tsx

import React from 'react';
import Modal from 'react-modal';
import { CartItem } from '../context/AuthContext'; 
import { Product } from '../types/product'; 
import CommentsSection from './CommentSection'; 

interface ProductModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  product: Product | null;
  cartItems: CartItem[];
  handleRemoveFromCart: (productId: number, quantity?: number) => Promise<void>;
  handleAddToCart: (product: Product) => Promise<void>;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onRequestClose,
  product,
  cartItems,
  handleRemoveFromCart,
  handleAddToCart,
}) => {
  if (!product) return null;

  // Hitta produktens kvantitet i varukorgen
  const cartItem = cartItems.find(item => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="product-details-modal" 
    >
      {product && (
        <div className="ViewModal"> 
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p>Pris: {product.price} kr</p>
          
          {quantity > 0 ? (
            <div className="quantity-control">
              <button
                className="decrease-btn" 
                onClick={() => handleRemoveFromCart(product.id, 1)}
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                className="increase-btn" 
                onClick={() => handleAddToCart(product)}
              >
                +
              </button>
            </div>
          ) : (
            <div className="button-container"> 
              <button
                className="add-to-cart-btn" 
                onClick={() => handleAddToCart(product)}
              >
                Lägg till i varukorg
              </button>
            </div>
          )}

          <CommentsSection productId={product.id} />

          <button
            className="close-modal-btn" 
            onClick={onRequestClose}
          >
            Stäng
          </button>
        </div>
      )}
    </Modal>
  );
};

export default ProductModal;
