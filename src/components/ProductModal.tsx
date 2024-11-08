import React from 'react';
import Modal from 'react-modal';
import CommentsSection from './CommentSection';

interface ProductModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  product: any; 
  cartItems: any[]; 
  handleRemoveFromCart: (productId: number, quantity?: number) => Promise<void>;
  handleAddToCart: (product: any) => Promise<void>;
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
          {/* Visa produktbilden */}
          {product.image_url && (
            <img 
              src={`http://localhost:3001${product.image_url}`} 
              alt={product.name} 
              className="product-image"
              style={{ width: '100%', borderRadius: '8px', marginBottom: '20px' }} 
            />
          )}
          
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
