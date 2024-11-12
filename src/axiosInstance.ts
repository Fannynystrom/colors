import axios from 'axios';

//  Axios-instans
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001', 
});

//  en interceptor för att lägga till Authorization-headern
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
