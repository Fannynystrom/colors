import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Pay: React.FC = () => {
  const authContext = useContext(AuthContext);
  const cartItems = authContext?.cartItems || [];

  // Beräkna totalsumman
  const totalSum = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <h1>Kassan</h1>
      <ul>
        {cartItems.map(item => (
          <li key={item.id}>
            <p>Produkt: {item.name}</p>
            <p>Pris: {item.price} kr</p>
            <p>Antal: {item.quantity}</p>
            <p>Totalt: {item.price * item.quantity} kr</p>
          </li>
        ))}
      </ul>
      <h2>Totalsumma: {totalSum} kr</h2>
    </div>
  );
};

export default Pay;
