import axios from "axios";

const API_URL = "http://10.0.15.66:8080"; // tu backend

export const loginUser = async (email, password) => {
  return axios.post(`${API_URL}/usuario/login`, { email, password });
};

export const registerUser = async (userData) => {
  return axios.post(`${API_URL}/usuario/guardar`, userData);
};
