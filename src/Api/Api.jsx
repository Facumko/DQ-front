import axios from "axios";

// Configuración del backend
const API_URL = "http://10.0.15.66:8080";

// Función para login - endpoint correcto
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { 
      email, 
      password 
    });
    
    console.log("Login exitoso:", response.data);
    
    // ✅ Validación ANTES del return
    if (!response.data || !response.data.idUser) {
      throw new Error('Respuesta inválida del servidor');
    }
    
    return response.data;
    
  } catch (error) {
    console.error("Error en login:", error);
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error('Email o contraseña incorrectos');
        case 404:
          throw new Error('Usuario no encontrado');
        case 500:
          throw new Error('Error interno del servidor');
        default:
          throw new Error(`Error ${error.response.status}: ${error.response.data?.message || 'Error al iniciar sesión'}`);
      }
    } else if (error.request) {
      throw new Error('No se pudo conectar al servidor. Verifica que el backend esté corriendo en '+ API_URL);
    } else {
      throw new Error(error.message || 'Error inesperado. Intenta nuevamente.');
    }
  }
};

// Función para registro - endpoint específico
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/registrarse`, userData);
    
    console.log("Registro exitoso:", response.data);
    
    // ✅ Validación opcional según tu backend
    if (!response.data) {
      throw new Error('Respuesta inválida del servidor');
    }
    
    return response.data;
    
  } catch (error) {
    console.error("Error en registro:", error);
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error('Datos de registro inválidos');
        case 409:
          throw new Error('El email ya está registrado');
        case 500:
          throw new Error('Error interno del servidor');
        default:
          throw new Error(`Error ${error.response.status}: ${error.response.data?.message || 'Error al registrar usuario'}`);
      }
    } else if (error.request) {
      throw new Error('No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://192.168.1.64:8080');
    } else {
      throw new Error(error.message || 'Error inesperado. Intenta nuevamente.');
    }
  }
};

// Función para verificar conexión con el backend
export const checkConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.warn("Backend no disponible:", error.message);
    return null;
  }
};

// Configuración global de axios
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interceptor para manejar errores globalmente
axios.interceptors.response.use(
  response => response,
  error => {
    console.error("Error en petición HTTP:", error);
    return Promise.reject(error);
  }
);