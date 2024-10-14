import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginStyles.css'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3001/login', {
        username,
        password,
      });

      console.log('Inloggad:', response.data);
      navigate('/hem'); 
      setUsername('');
      setPassword('');
    } catch (err) {
      const errorResponse = (err as AxiosError).response;

      const errorMessage = typeof errorResponse?.data === 'string'
        ? errorResponse.data
        : 'Felaktigt användarnamn eller lösenord.';

      setError(errorMessage);
      console.error('Inloggning misslyckades:', err);
    }
  };

  return (
    <div className="login-container">
      <h2>Logga in</h2>
      <form onSubmit={handleLogin}>
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
        <button type="submit">Logga in</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Vill du registrera dig? <a href="/register">Klicka här</a>
      </p>
    </div>
  );
};

export default Login;
