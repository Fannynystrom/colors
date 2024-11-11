import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import '../styles/RegisterStyles.css'

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('http://localhost:3001/register', {
        username,
        password,
      });
      console.log('Registrerad:', response.data);
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // visar backend-meddelande 
      } else {
        setError('Registrering misslyckades.');
      }
      console.error('Registrering misslyckades:', err);
    }
  };

  return (
    <div className="register-container">
      <h2>Registrera dig</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="username">Användarnamn:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Lösenord:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Registrera</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Register;
