import axios from "axios";

// ============================================
// CONFIGURACIÓN
// ============================================

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.3:8080";
const TIMEOUT = 15000;
const MAX_RETRIES = 2;
const isDevelopment = import.meta.env.MODE === 'development';

// ============================================
// ENDPOINTS CENTRALIZADOS
// ============================================

const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/registrarse',
  LOGOUT: '/auth/logout',
  
  // Usuario
  GET_USER: (id) => `/usuario/traer/${id}`,
  UPDATE_USER: (id) => `/usuario/editar/${id}`,
  DELETE_USER: (id) => `/usuario/eliminar/${id}`,
  
  // Categorías
  GET_CATEGORIES: '/categoria/traer',
  
  // Imágenes
  GET_IMAGES: '/imagen/traer',
  UPLOAD_IMAGE: '/imagen/guardar',
  
  // Health
  HEALTH: '/health',
};

// ============================================
// CONFIGURACIÓN GLOBAL DE AXIOS
// ============================================

axios.defaults.timeout = TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Generar username único desde email
 */
export const generateUsername = (email) => {
  const baseName = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseName}${randomSuffix}`;
};

/**
 * Capitalizar primera letra
 */
export const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Validar formato de email
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validar fuerza de contraseña
 */
export const validatePasswordStrength = (password) => {
  if (!password) return { strength: 'none', message: '' };
  
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const score = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (score <= 2) return { strength: 'weak', message: 'Contraseña débil', color: '#ff4444' };
  if (score <= 3) return { strength: 'medium', message: 'Contraseña media', color: '#ffaa00' };
  return { strength: 'strong', message: 'Contraseña fuerte', color: '#00cc66' };
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error) => {
  if (!error.response) return true;
  if (error.code === 'ECONNABORTED') return true;
  if (error.response.status >= 500) return true;
  return false;
};

const handleApiError = (error, endpoint) => {
  if (isDevelopment) {
    console.error(`❌ Error en ${endpoint}:`, error);
  }
  
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('⏱️ La petición tardó demasiado tiempo. Verifica tu conexión a internet.');
    }
    return new Error(`🔌 No se pudo conectar al servidor. Verifica que el backend esté corriendo en ${API_URL}`);
  }
  
  const { status, data } = error.response;
  const serverMessage = data?.message || data?.error;
  
  const errorMessages = {
    400: 'Datos inválidos. Por favor revisa la información ingresada.',
    401: 'Credenciales incorrectas. Verifica tu email y contraseña.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'Recurso no encontrado. Verifica que exista.',
    409: 'Ya existe un registro con estos datos (email o username duplicado).',
    422: 'Error de validación. Revisa que todos los campos sean correctos.',
    500: 'Error interno del servidor. Por favor intenta nuevamente en unos minutos.',
    502: 'Servidor no disponible. Intenta nuevamente más tarde.',
    503: 'Servicio temporalmente no disponible. Intenta nuevamente en unos minutos.',
  };
  
  const message = serverMessage || errorMessages[status] || `Error ${status}: Error inesperado del servidor`;
  return new Error(message);
};

const validateParams = (params, paramNames) => {
  for (const name of paramNames) {
    if (params[name] === null || params[name] === undefined || params[name] === '') {
      throw new Error(`Parámetro requerido faltante: ${name}`);
    }
  }
};

const logRequest = (method, endpoint, data) => {
  if (isDevelopment) {
    console.log(`🌐 ${method} ${endpoint}`, data ? data : '');
  }
};

const logResponse = (method, endpoint, data) => {
  if (isDevelopment) {
    console.log(`✅ ${method} ${endpoint} - Success`, data);
  }
};

// ============================================
// FUNCIÓN CENTRALIZADA DE PETICIONES HTTP
// ============================================

const apiRequest = async (method, endpoint, data = null, retries = MAX_RETRIES) => {
  logRequest(method, endpoint, data);
  
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    logResponse(method, endpoint, response.data);
    return response.data;
    
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      const attemptNumber = MAX_RETRIES - retries + 1;
      
      if (isDevelopment) {
        console.warn(`⚠️ Reintentando petición... (Intento ${attemptNumber}/${MAX_RETRIES})`);
      }
      
      await sleep(1000 * attemptNumber);
      return apiRequest(method, endpoint, data, retries - 1);
    }
    
    throw handleApiError(error, endpoint);
  }
};

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Iniciar sesión
 */
export const loginUser = async (email, password) => {
  validateParams({ email, password }, ['email', 'password']);
  
  if (!validateEmail(email)) {
    throw new Error('Por favor ingresa un email válido');
  }
  
  try {
    const response = await apiRequest('POST', ENDPOINTS.LOGIN, { email, password });
    
    if (!response || !response.idUser) {
      throw new Error('Respuesta inválida del servidor: falta ID de usuario');
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Registrar nuevo usuario
 */
export const registerUser = async (userData) => {
  validateParams(userData, ['email', 'password']);
  
  // Validar email
  if (!validateEmail(userData.email)) {
    throw new Error('Por favor ingresa un email válido');
  }
  
  // Validar contraseña mínima
  if (userData.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  // Generar username automáticamente si no existe
  const username = userData.username || generateUsername(userData.email);
  
  // Generar name desde email si no existe
  const name = userData.name || capitalizeFirstLetter(userData.email.split('@')[0]);
  
  // Preparar datos para el backend
  const registrationData = {
    email: userData.email,
    password: userData.password,
    username: username,
    name: name,
    lastname: userData.lastname || '',
    recovery_email: userData.recovery_email || userData.email,
  };
  
  try {
    const response = await apiRequest('POST', ENDPOINTS.REGISTER, registrationData);
    
    if (!response) {
      throw new Error('Respuesta inválida del servidor');
    }
    
    return response;
  } catch (error) {
    // Si el error es de username duplicado, reintentar con nuevo username
    if (error.message.includes('duplicado') || error.message.includes('409')) {
      if (isDevelopment) {
        console.log('Username duplicado, reintentando con nuevo username...');
      }
      
      registrationData.username = generateUsername(userData.email);
      const retryResponse = await apiRequest('POST', ENDPOINTS.REGISTER, registrationData);
      
      if (!retryResponse) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      return retryResponse;
    }
    
    throw error;
  }
};

/**
 * Cerrar sesión
 */
export const logoutUser = async (userId) => {
  try {
    const response = await apiRequest('POST', ENDPOINTS.LOGOUT, { userId });
    return response;
  } catch (error) {
    // Aunque falle el logout en backend, limpiamos sesión local
    if (isDevelopment) {
      console.warn('Error en logout del backend, limpiando sesión local:', error.message);
    }
    return { success: true, message: 'Sesión cerrada localmente' };
  }
};

// ============================================
// FUNCIONES DE USUARIO
// ============================================

export const getUserById = async (idUser) => {
  validateParams({ idUser }, ['idUser']);
  return apiRequest('GET', ENDPOINTS.GET_USER(idUser));
};

export const updateUser = async (idUser, userData) => {
  validateParams({ idUser, userData }, ['idUser', 'userData']);
  return apiRequest('PUT', ENDPOINTS.UPDATE_USER(idUser), userData);
};

export const deleteUser = async (idUser) => {
  validateParams({ idUser }, ['idUser']);
  return apiRequest('DELETE', ENDPOINTS.DELETE_USER(idUser));
};

// ============================================
// FUNCIONES DE CATEGORÍAS
// ============================================

export const getCategories = async () => {
  return apiRequest('GET', ENDPOINTS.GET_CATEGORIES);
};

// ============================================
// FUNCIONES DE IMÁGENES
// ============================================

export const getImages = async () => {
  return apiRequest('GET', ENDPOINTS.GET_IMAGES);
};

export const uploadImage = async (imageData) => {
  validateParams({ imageData }, ['imageData']);
  return apiRequest('POST', ENDPOINTS.UPLOAD_IMAGE, imageData);
};

// ============================================
// FUNCIÓN DE HEALTH CHECK
// ============================================

export const checkConnection = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.HEALTH);
    
    if (isDevelopment) {
      console.log("✅ Backend disponible:", response);
    }
    
    return {
      available: true,
      data: response,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (isDevelopment) {
      console.warn("⚠️ Backend no disponible:", error.message);
    }
    
    return {
      available: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================

export default {
  // Auth
  loginUser,
  registerUser,
  logoutUser,
  
  // Usuario
  getUserById,
  updateUser,
  deleteUser,
  
  // Categorías
  getCategories,
  
  // Imágenes
  getImages,
  uploadImage,
  
  // Utilidades
  checkConnection,
  generateUsername,
  capitalizeFirstLetter,
  validateEmail,
  validatePasswordStrength,
};