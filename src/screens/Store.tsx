import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; 

function Store() {
  const authContext = useContext(AuthContext);
  const isAdmin = authContext?.role === 'admin'; // kollar om användaren är admin

  return (
    <div>
      <h1>Butik</h1>
      {isAdmin && ( //  knappen visas endast för admin
        <button>Lägg till produkt</button>
      )}
    </div>
  );
}

export default Store;
