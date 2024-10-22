import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import '../styles/RegisterStyles.css'

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  // funktion för att kontrollera lösenordet och om de uppfyller krav
  const validatePassword = (password: string) => {
    const symbolPattern = /[!@#$%^&*(),.?":{}|<>]/g;
    const hasTwoSymbols = (password.match(symbolPattern) || []).length >= 2;

    if (password.length >= 15 || (password.length >= 10 && hasTwoSymbols)) {
      return true;
    }
    return false;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // kollar lösenordet innan registrering om de inte uppfyller kraven meddelas detta 
    if (!validatePassword(password)) {
      setError('Lösenordet måste vara minst 15 tecken långt, eller minst 10 tecken långt och innehålla minst två symboler.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/register', {
        username,
        password,
      });
      console.log('Registrerad:', response.data);
      navigate('/');
    } catch (err) {
      setError('Registrering misslyckades.');
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
