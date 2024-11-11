// src/screens/Login.tsx
import React, { useState, useContext, useEffect } from 'react';
import axios from '../axiosInstance'; // Importera din Axios-instans
import { useNavigate } from 'react-router-dom';
import '../styles/LoginStyles.css'; 
import { AuthContext } from '../context/AuthContext'; 

interface LoginErrorResponse {
  message: string;
  remainingTime?: number;
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const navigate = useNavigate();
  const authContext = useContext(AuthContext); 

  useEffect(() => {
    // om servern skickar blockering på 30 sek, startas en timer för nedräkning
    if (remainingTime !== null && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);

      // rensar timern när tiden är noll
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('/login', {
        username,
        password,
      });

      const token = response.data.token;
      if (authContext) {
        authContext.login(token); 
      }

      navigate('/about');
      setUsername('');
      setPassword('');
      setError('');
      setRemainingTime(null);
    } catch (err: any) {
      const errorResponse = err.response?.data as LoginErrorResponse;
      
      if (
        err.response?.status === 429 && 
        errorResponse && 
        'remainingTime' in errorResponse
      ) {
        const data = errorResponse; 
        setRemainingTime(data.remainingTime ?? 0); // nedräkningstiden från servern
      } else {
        const errorMessage = typeof err.response?.data === 'string'
          ? err.response.data
          : 'Felaktigt användarnamn eller lösenord.';

        setError(errorMessage);
      }
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
            disabled={remainingTime !== null && remainingTime > 0}
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
            disabled={remainingTime !== null && remainingTime > 0}
          />
        </div>
        <button type="submit" disabled={remainingTime !== null && remainingTime > 0}>Logga in</button>
      </form>
      {error && <p className="error">{error}</p>}
      {remainingTime !== null && remainingTime > 0 && (
        <p className="error countdown">För många misslyckade försök. Försök igen om {remainingTime} sekunder.</p>
      )}
      <p>
        Vill du registrera dig? <a href="/register">Klicka här</a>
      </p>
    </div>
  );
};

export default Login;
