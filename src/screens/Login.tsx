import React, { useState, useContext, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
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
      const response = await axios.post('http://localhost:3001/login', {
        username,
        password,
      });
  
      console.log('Inloggad:', response.data);
  
      if (authContext) {
        authContext.login(response.data.userId, response.data.role); 
      }
  
      navigate('/about');
      setUsername('');
      setPassword('');
    } catch (err) {
      const errorResponse = err as AxiosError<LoginErrorResponse>;
      
      if (
        errorResponse?.response?.status === 429 && 
        errorResponse.response.data && 
        typeof errorResponse.response.data === 'object' && 
        'remainingTime' in errorResponse.response.data
      ) {
        const data = errorResponse.response.data; 
        setRemainingTime(data.remainingTime ?? 0); // nedräkningstiden från servern
      } else {
        const errorMessage = typeof errorResponse?.response?.data === 'string'
          ? errorResponse.response.data
          : 'Felaktigt användarnamn eller lösenord.';
  
        setError(errorMessage);
      }

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
