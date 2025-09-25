import axios from "axios";

const API_URL = "http://192.168.1.64:8080"; // tu backend

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/usuario/guardar`, { email, password });
    return response.data;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error('Email o contraseña incorrectos');
        case 404:
          throw new Error('Usuario no encontrado');
        case 500:
          throw new Error('Error interno del servidor');
        default:
          throw new Error('Error al iniciar sesión');
      }
    } else if (error.request) {
      throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
    } else {
      throw new Error('Error inesperado. Intenta nuevamente.');
    }
  }
};

// 🔥 NUEVA FUNCIÓN - Esta es la que falta
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/usuario/guardar`, userData);
    return response.data;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error('Datos de registro inválidos');
        case 409:
          throw new Error('El email ya está registrado');
        case 500:
          throw new Error('Error interno del servidor');
        default:
          throw new Error('Error al registrar usuario');
      }
    } else if (error.request) {
      throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
    } else {
      throw new Error('Error inesperado. Intenta nuevamente.');
    }
  }
};