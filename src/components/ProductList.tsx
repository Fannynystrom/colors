import React from 'react';
import { FaEdit } from 'react-icons/fa';

interface ProductListProps {
  products: any[];
  isAdmin: boolean;
  cartQuantities: { [productId: number]: number };
  handleProductClick: (product: any) => void;
  handleDecreaseQuantity: (productId: number) => void;
  handleIncreaseQuantity: (productId: number) => void;
  handleAddToCart: (product: any) => void;
  openEditModal: (product: any) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isAdmin,
  cartQuantities,
  handleProductClick,
  handleDecreaseQuantity,
  handleIncreaseQuantity,
  handleAddToCart,
  openEditModal,
}) => {
  return (
    <div>
      <h2>Produkter</h2>
      <ul>
        {products.map(product => (
          <li key={product.id} onClick={() => handleProductClick(product)}>
            {isAdmin && (
              <FaEdit onClick={(e) => { e.stopPropagation(); openEditModal(product); }} style={{ cursor: 'pointer', float: 'right', fontSize: '1.3em' }} />
            )}
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>Pris: {product.price} kr</p>
            <p>Lagerstatus: {product.stock} st</p>
            {cartQuantities[product.id] ? (
              <div className="quantity-control">
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
  );
};

export default ProductList;
