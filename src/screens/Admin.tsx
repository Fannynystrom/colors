import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import '../styles/AdminLogs.css'; 

interface User {
  id: number;
  username: string;
  role: string;
}

type LogEntry = {
  id: number;
  timestamp: string;
  username: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
};

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/admin/users');
        setUsers(response.data);
      } catch (err: any) {
        setError('Kunde inte hämta användare.');
        console.error(err);
      }
    };

    const fetchLogs = async () => {
      try {
        const response = await axiosInstance.get('/login-logs');
        setLogs(response.data);
      } catch (err: any) {
        setError('Kunde inte hämta inloggningsloggar.');
        console.error(err);
      }
    };

    fetchUsers();
    fetchLogs();
  }, []);

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err: any) {
      setError('Kunde inte uppdatera användarens roll.');
      console.error(err);
    }
  };

  return (
    <div className="admin-container">
      <h1>Administration</h1>
      {error && <p className="error">{error}</p>}

      <div className="admin-sections">
        <section className="user-management admin-card">
          <h2>Användare</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Användarnamn</th>
                <th>Roll</th>
                <th>Uppdatera Roll</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>
                    {user.role !== 'admin' ? (
                      <button onClick={() => updateUserRole(user.id, 'admin')}>Gör till Admin</button>
                    ) : (
                      <button onClick={() => updateUserRole(user.id, 'user')}>Gör till Användare</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="login-logs admin-card">
          <h2>Senaste Inloggningsförsök</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tid</th>
                <th>Användarnamn</th>
                <th>Lyckades</th>
                <th>IP-adress</th>
                <th>User-Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.username}</td>
                  <td>{log.success ? 'Ja' : 'Nej'}</td>
                  <td>{log.ip_address || 'N/A'}</td>
                  <td className="user-agent">{log.user_agent || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Admin;
