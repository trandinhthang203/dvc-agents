import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://52.62.70.242:8000/';

const api = axios.create({
  baseURL: API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RegisterPayload {
  fullname: string;
  citizenid: string;
  phonenumber: string;
  dateofbirth: string; // format: YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  province: string;
  district: string;
  ward: string;
  avatarurl?: string;
  password: string;
}

export const authService = {
  register: async (userData: RegisterPayload) => {
    const response = await api.post('auth/register', userData);
    return response.data;
  },
  login: async (credentials: { citizenid: string; password: string }) => {
    // OAuth2 Password Flow requires application/x-www-form-urlencoded
    // and the field must be named "username"
    const formBody = new URLSearchParams({
      username: credentials.citizenid,
      password: credentials.password,
    });
    const response = await api.post('auth/login', formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
};

export default api;
