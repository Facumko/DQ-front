import axios from "axios";
const API_URL = "http://192.168.1.6:8080"; //Back

export const registerUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, {
      email,
      password,
    });
    return response.data; // puede incluir id, name, token, etc.
  } catch (err) {
    throw err.response ? err.response.data : err;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      email,
      password,
    });
    return response.data; // usuario y token
  } catch (err) {
    throw err.response ? err.response.data : err;
  }
};
