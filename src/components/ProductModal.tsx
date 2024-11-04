import React from 'react';
import Modal from 'react-modal';
import CommentsSection from './CommentSection'; 

interface ProductModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  product: any; 
  cartQuantities: { [productId: number]: number };
  handleDecreaseQuantity: (productId: number) => void;
  handleIncreaseQuantity: (productId: number) => void;
  handleAddToCart: (product: any) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onRequestClose,
  product,
  cartQuantities,
  handleDecreaseQuantity,
  handleIncreaseQuantity,
  handleAddToCart,
}) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} className="product-details-modal">
      {product && (
        <div className="ViewModal">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p>Pris: {product.price} kr</p>
          <p>Lagerstatus: {product.stock} st</p>
          {cartQuantities[product.id] ? (
            <div className="quantity-control">
              <button className="decrease-btn" onClick={() => handleDecreaseQuantity(product.id)}>
                -
              </button>
              <span>{cartQuantities[product.id]}</span>
              <button className="increase-btn" onClick={() => handleIncreaseQuantity(product.id)}>
                +
              </button>
            </div>
          ) : (
            <div className="button-container">
              <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)}>
                Lägg till i varukorg
              </button>
            </div>
          )}
          {/* Kommentar-sektion eller övrig kod */}
          <CommentsSection productId={product.id} />

          <button className="close-modal-btn" onClick={onRequestClose}>
            Stäng
          </button>
        </div>
      )}
    </Modal>
  );
};

export default ProductModal;
