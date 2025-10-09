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

// ===== USUARIO =====

/**
 * Obtener información de un usuario por ID
 * @param {BigInt} idUser - ID del usuario
 * @returns {Promise} - Datos del usuario
 */
export const getUserById = async (idUser) => {
  try {
    const response = await axios.get(`${API_URL}/usuario/${idUser}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al obtener información del usuario"
    );
  }
};

/**
 * Actualizar información del usuario
 * @param {BigInt} idUser - ID del usuario
 * @param {Object} userData - Datos a actualizar
 * @param {string} userData.username - Nombre de usuario
 * @param {string} userData.name - Nombre
 * @param {string} userData.lastname - Apellido
 * @param {string} userData.email - Correo electrónico
 * @param {string} userData.password - Contraseña (opcional)
 * @param {string} userData.recoveryEmail - Email de recuperación
 * @param {} userData.phone - Teléfono
 * @returns {Promise} - Usuario actualizado
 */
export const updateUser = async (idUser, userData) => {
  try {
    const response = await axios.put(
      `${API_URL}/usuario/editar/${idUser}`,
      userData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al actualizar usuario"
    );
  }
};

/**
 * Eliminar usuario
 * @param {BigInt} idUser - ID del usuario
 * @returns {Promise}
 */
export const deleteUser = async (idUser) => {
  try {
    const response = await axios.delete(
      `${API_URL}/usuario/borrar/${idUser}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al eliminar usuario"
    );
  }
};

// ===== CATEGORÍAS =====
export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categoria/traer`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al obtener categorías"
    );
  }
};

// ===== IMÁGENES =====
export const getImages = async () => {
  try {
    const response = await axios.get(`${API_URL}/imagen/traer`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al obtener imágenes"
    );
  }
};

export const uploadImage = async (imageData) => {
  try {
    const response = await axios.post(
      `${API_URL}/imagen/guardar`,
      imageData
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Error al subir imagen");
  }
};

export default {
  loginUser,
  registerUser,
  getUserById,
  updateUser,
  deleteUser,
  getCategories,
  getImages,
  uploadImage,
};