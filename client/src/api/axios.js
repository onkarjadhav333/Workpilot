import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  //       ↑ reads from .env in dev, from Vercel env vars in production
  withCredentials: true  
});

export default API;