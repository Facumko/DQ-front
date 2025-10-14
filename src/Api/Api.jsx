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
  
  // Imágenes (antiguas)
  GET_IMAGES: '/imagen/traer',
  UPLOAD_IMAGE: '/imagen/guardar',
  
  // Comercios
  GET_BUSINESS_BY_USER: (userId) => `/comercio/traer/usuario/${userId}`,
  GET_BUSINESS: (businessId) => `/comercio/traer/${businessId}`,
  UPDATE_BUSINESS: (businessId) => `/comercio/editar/${businessId}`,
  CREATE_BUSINESS: '/comercio/guardar',
  
  // Imágenes de Comercio
  UPLOAD_PROFILE_IMAGE: (businessId) => `/comercio/establecer/imagen/perfil/${businessId}`,
  UPLOAD_COVER_IMAGE: (businessId) => `/comercio/establecer/imagen/portada/${businessId}`,
  UPLOAD_GALLERY_IMAGES: (businessId) => `/comercio/agregar/imagenes/galeria/${businessId}`,
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

export const generateUsername = (email) => {
  const baseName = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseName}${randomSuffix}`;
};

export const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

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

export const registerUser = async (userData) => {
  validateParams(userData, ['email', 'password']);
  
  if (!validateEmail(userData.email)) {
    throw new Error('Por favor ingresa un email válido');
  }
  
  if (userData.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  const username = userData.username || generateUsername(userData.email);
  const name = userData.name || capitalizeFirstLetter(userData.email.split('@')[0]);
  
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

export const logoutUser = async (userId) => {
  try {
    const response = await apiRequest('POST', ENDPOINTS.LOGOUT, { userId });
    return response;
  } catch (error) {
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
// FUNCIONES DE IMÁGENES (ANTIGUAS)
// ============================================

export const getImages = async () => {
  return apiRequest('GET', ENDPOINTS.GET_IMAGES);
};

export const uploadImage = async (imageData) => {
  validateParams({ imageData }, ['imageData']);
  return apiRequest('POST', ENDPOINTS.UPLOAD_IMAGE, imageData);
};

// ============================================
// FUNCIONES DE NEGOCIOS
// ============================================

export const getBusinessByUserId = async (userId) => {
  validateParams({ userId }, ['userId']);
  
  try {
    const response = await apiRequest('GET', ENDPOINTS.GET_BUSINESS_BY_USER(userId));
    
    if (isDevelopment) {
      console.log("📦 Respuesta del backend (raw):", response);
    }
    
    const business = Array.isArray(response) ? response[0] : response;
    
    if (!business) {
      if (isDevelopment) {
        console.log("ℹ️ El usuario no tiene negocio creado");
      }
      return null;
    }
    
    const normalized = {
      id_business: business.idCommerce,
      id_user: business.idOwner,
      name: business.name || '',
      description: business.description || '',
      email: business.email || '',
      phone: business.phone || '',
      link: business.link || '',
      branchOf: business.branchOf || null,
      profileImage: business.profileImage || null,
      coverImage: business.coverImage || null,
    };
    
    if (isDevelopment) {
      console.log("✅ Negocio normalizado:", normalized);
    }
    
    return normalized;
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('no encontrado')) {
      if (isDevelopment) {
        console.log("ℹ️ El usuario no tiene negocio creado (404)");
      }
      return null;
    }
    throw error;
  }
};

export const getBusinessById = async (businessId) => {
  validateParams({ businessId }, ['businessId']);
  
  const response = await apiRequest('GET', ENDPOINTS.GET_BUSINESS(businessId));
  
  const business = Array.isArray(response) ? response[0] : response;
  
  if (!business) {
    throw new Error('Negocio no encontrado');
  }
  
  return {
    id_business: business.idCommerce,
    id_user: business.idOwner,
    name: business.name || '',
    description: business.description || '',
    email: business.email || '',
    phone: business.phone || '',
    link: business.link || '',
    branchOf: business.branchOf || null,
    profileImage: business.profileImage || null,
    coverImage: business.coverImage || null,
  };
};

export const createBusiness = async (businessData) => {
  validateParams({ businessData }, ['businessData']);
  
  if (!businessData.name || businessData.name.trim() === '') {
    throw new Error('El nombre del negocio es obligatorio');
  }
  
  if (!businessData.description || businessData.description.trim() === '') {
    throw new Error('La descripción del negocio es obligatoria');
  }
  
  if (!businessData.id_user) {
    throw new Error('El ID de usuario es obligatorio');
  }
  
  const dataToSend = {
    idOwner: businessData.id_user,
    name: businessData.name.trim(),
    description: businessData.description.trim(),
    email: businessData.email?.trim() || '',
    phone: businessData.phone?.trim() || '',
    link: businessData.link?.trim() || '',
    branchOf: businessData.branchOf || null,
  };
  
  if (isDevelopment) {
    console.log("📤 Enviando al backend:", dataToSend);
  }
  
  const response = await apiRequest('POST', ENDPOINTS.CREATE_BUSINESS, dataToSend);
  
  if (isDevelopment) {
    console.log("📦 Respuesta del backend:", response);
  }
  
  return {
    id_business: response.idCommerce,
    id_user: response.idOwner,
    name: response.name,
    description: response.description,
    email: response.email,
    phone: response.phone,
    link: response.link,
    branchOf: response.branchOf,
    profileImage: response.profileImage || null,
    coverImage: response.coverImage || null,
  };
};

export const updateBusiness = async (businessId, businessData) => {
  validateParams({ businessId, businessData }, ['businessId', 'businessData']);
  
  if (businessData.name !== undefined && businessData.name.trim() === '') {
    throw new Error('El nombre del negocio no puede estar vacío');
  }
  
  if (businessData.description !== undefined && businessData.description.trim() === '') {
    throw new Error('La descripción del negocio no puede estar vacía');
  }
  
  const dataToSend = {};
  
  if (businessData.name !== undefined) dataToSend.name = businessData.name.trim();
  if (businessData.description !== undefined) dataToSend.description = businessData.description.trim();
  if (businessData.email !== undefined) dataToSend.email = businessData.email.trim();
  if (businessData.phone !== undefined) dataToSend.phone = businessData.phone.trim();
  if (businessData.link !== undefined) dataToSend.link = businessData.link.trim();
  if (businessData.branchOf !== undefined) dataToSend.branchOf = businessData.branchOf;
  
  if (isDevelopment) {
    console.log("📤 Actualizando negocio:", businessId, dataToSend);
  }
  
  const response = await apiRequest('PUT', ENDPOINTS.UPDATE_BUSINESS(businessId), dataToSend);
  
  if (isDevelopment) {
    console.log("📦 Respuesta del backend:", response);
  }
  
  return {
    id_business: response.idCommerce,
    id_user: response.idOwner,
    name: response.name,
    description: response.description,
    email: response.email,
    phone: response.phone,
    link: response.link,
    branchOf: response.branchOf,
    profileImage: response.profileImage || null,
    coverImage: response.coverImage || null,
  };
};

// ============================================
// FUNCIONES DE IMÁGENES DE COMERCIO
// ============================================

/**
 * Subir imagen de perfil y recargar negocio actualizado
 */
export const uploadProfileImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  
  if (!(imageFile instanceof File)) {
    throw new Error('Debes proporcionar un archivo de imagen válido');
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > maxSize) {
    throw new Error('La imagen no puede superar los 5MB');
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(imageFile.type)) {
    throw new Error('Formato de imagen no válido. Usa JPG, PNG o WebP');
  }
  
  const formData = new FormData();
  formData.append('file', imageFile);
  
  try {
    if (isDevelopment) {
      console.log('📤 Subiendo imagen de perfil...');
    }
    
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.UPLOAD_PROFILE_IMAGE(businessId)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Imagen de perfil subida:', response.data);
    }
    
    // Recargar negocio para obtener URL actualizada
    await sleep(500); // Esperar a que el backend procese
    const updatedBusiness = await getBusinessById(businessId);
    
    return {
      cloudinaryResponse: response.data,
      profileImage: updatedBusiness.profileImage,
    };
  } catch (error) {
    throw handleApiError(error, 'uploadProfileImage');
  }
};

/**
 * Subir imagen de portada y recargar negocio actualizado
 */
export const uploadCoverImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  
  if (!(imageFile instanceof File)) {
    throw new Error('Debes proporcionar un archivo de imagen válido');
  }
  
  const maxSize = 5 * 1024 * 1024;
  if (imageFile.size > maxSize) {
    throw new Error('La imagen no puede superar los 5MB');
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(imageFile.type)) {
    throw new Error('Formato de imagen no válido. Usa JPG, PNG o WebP');
  }
  
  const formData = new FormData();
  formData.append('file', imageFile);
  
  try {
    if (isDevelopment) {
      console.log('📤 Subiendo imagen de portada...');
    }
    
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.UPLOAD_COVER_IMAGE(businessId)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Imagen de portada subida:', response.data);
    }
    
    await sleep(500);
    const updatedBusiness = await getBusinessById(businessId);
    
    return {
      cloudinaryResponse: response.data,
      coverImage: updatedBusiness.coverImage,
    };
  } catch (error) {
    throw handleApiError(error, 'uploadCoverImage');
  }
};

/**
 * Subir múltiples imágenes a la galería
 */
export const uploadGalleryImages = async (businessId, imageFiles) => {
  validateParams({ businessId, imageFiles }, ['businessId', 'imageFiles']);
  
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
    throw new Error('Debes proporcionar al menos una imagen');
  }
  
  if (imageFiles.length > 10) {
    throw new Error('Máximo 10 imágenes por vez');
  }
  
  const maxSize = 5 * 1024 * 1024;
  for (const file of imageFiles) {
    if (file.size > maxSize) {
      throw new Error(`La imagen "${file.name}" supera los 5MB`);
    }
  }
  
  const formData = new FormData();
  imageFiles.forEach((file) => {
    formData.append('files', file);
  });
  
  try {
    if (isDevelopment) {
      console.log(`📤 Subiendo ${imageFiles.length} imágenes a galería...`);
    }
    
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.UPLOAD_GALLERY_IMAGES(businessId)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Imágenes de galería subidas:', response.data);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'uploadGalleryImages');
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
  
  // Imágenes (antiguas)
  getImages,
  uploadImage,
  
  // Negocios
  getBusinessByUserId,
  getBusinessById,
  createBusiness,
  updateBusiness,
  
  // Imágenes de Comercio
  uploadProfileImage,
  uploadCoverImage,
  uploadGalleryImages,
  
  // Utilidades
  generateUsername,
  capitalizeFirstLetter,
  validateEmail,
  validatePasswordStrength,
};