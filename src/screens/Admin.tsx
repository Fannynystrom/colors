import React, { useEffect, useState } from 'react';
import '../styles/AdminLogs.css';


type LogEntry = {
  id: number;
  timestamp: string;
  username: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
};

const Admin = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:3001/login-logs'); 
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Error fetching login logs:', error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div>
      <h1>Admin</h1>
      <h2>Senaste inloggningsförsök</h2>
      <table>
        <thead>
          <tr>
            <th>Tid</th>
            <th>Användarnamn</th>
            <th>IP-adress</th>
            <th>User-Agent</th>
            <th>Lyckades</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.username}</td>
              <td>{log.ip_address}</td>
              <td className="user-agent">{log.user_agent}</td> 
              <td>{log.success ? 'Ja' : 'Nej'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
};

export default Admin;
