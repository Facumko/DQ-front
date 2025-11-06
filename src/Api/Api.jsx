import axios from "axios";

// ============================================
// CONFIGURACIÓN
// ============================================

const API_URL = import.meta.env.VITE_API_URL || "https://superadditional-septariate-olevia.ngrok-free.dev";
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

  // Publicaciones
  POST_CREATE: '/publicacion/crear',
  POST_GET_ALL: '/publicacion/traer',
  POST_GET_BY_ID: (postId) => `/publicacion/traer/${postId}`,
  POST_GET_BY_COMMERCE: (commerceId) => `/publicacion/traer/comercio/${commerceId}`, 
  POST_UPDATE: (postId) => `/publicacion/editar/${postId}`,
  POST_DELETE: (postId) => `/publicacion/eliminar/${postId}`,
  POST_ADD_IMAGES: (postId) => `/publicacion/agregar/imagenes/${postId}`,
  POST_DELETE_IMAGES: (postId) => `/publicacion/eliminar/imagenes/${postId}`,

  // Búsqueda
  SEARCH_COMMERCES: '/comercio/buscar',
};

// ============================================
// CONFIGURACIÓN GLOBAL DE AXIOS - ACTUALIZADA
// ============================================

axios.defaults.timeout = TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// ✅ HEADERS ESPECÍFICOS PARA NGROK
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';

// Configuración importante para CORS
axios.defaults.withCredentials = false;

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

// ============================================
// FUNCIÓN DE VALIDACIÓN DE RESPUESTA
// ============================================

const validateApiResponse = (response, endpoint) => {
  // Si la respuesta es un string que contiene HTML, es un error
  if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
    throw new Error(`El servidor respondió con una página HTML en lugar de datos JSON. Posible problema de CORS en el endpoint: ${endpoint}`);
  }
  
  // Si la respuesta es un string que contiene ngrok, es un error
  if (typeof response === 'string' && response.includes('ngrok')) {
    throw new Error(`Ngrok está bloqueando la petición. Verifica la configuración de CORS. Endpoint: ${endpoint}`);
  }
  
  return true;
};

const handleApiError = (error, endpoint) => {
  if (isDevelopment) {
    console.error(`❌ Error en ${endpoint}:`, error);
  }
  
  // Verificar si es un error de ngrok/HTML
  if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
    return new Error(`🔒 Ngrok está bloqueando la petición por CORS. Endpoint: ${endpoint}. Configura los headers CORS en el backend.`);
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
// FUNCIÓN CENTRALIZADA DE PETICIONES HTTP - ACTUALIZADA
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
      'ngrok-skip-browser-warning': 'true', // ✅ Header específico para ngrok
      'Access-Control-Allow-Origin': '*',
    },
    // ✅ Configuración importante para CORS
    withCredentials: false,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    
    // ✅ VERIFICACIÓN CRÍTICA: Asegurar que la respuesta sea JSON, no HTML
    validateApiResponse(response.data, endpoint);
    
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
  
  if (isDevelopment) {
    console.log(`🔍 Obteniendo usuario con ID: ${idUser}`);
    console.log(`🔗 URL completa: ${API_URL}${ENDPOINTS.GET_USER(idUser)}`);
  }
  
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
    const business = Array.isArray(response) ? response[0] : response;
    
    if (!business) return null;
    
    // ✅ CORREGIDO: Usar datos directos del backend
    return {
      id_business: business.idCommerce,
      id_user: business.idOwner,
      name: business.name,
      description: business.description,
      email: business.email,
      phone: business.phone,
      link: business.link,
      branchOf: business.branchOf,
      profileImage: business.profileImage?.url || null,
      coverImage: business.coverImage?.url || null,
    };
    
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
  
  // ✅ CORREGIDO: Usar datos directos del backend
  const profileImageUrl = business.profileImage?.url || null;
  const coverImageUrl = business.coverImage?.url || null;
  
  if (isDevelopment) {
    console.log("🖼️ Datos del negocio completo:", business);
    console.log("🖼️ Imagen de perfil:", profileImageUrl);
    console.log("🖼️ Imagen de portada:", coverImageUrl);
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
    profileImage: profileImageUrl,
    coverImage: coverImageUrl,
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
  
  // ✅ CORREGIDO: Usar datos directos del backend
  const profileImageUrl = response.profileImage?.url || null;
  const coverImageUrl = response.coverImage?.url || null;
  
  return {
    id_business: response.idCommerce,
    id_user: response.idOwner,
    name: response.name,
    description: response.description,
    email: response.email,
    phone: response.phone,
    link: response.link,
    branchOf: response.branchOf,
    profileImage: profileImageUrl,
    coverImage: coverImageUrl,
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
  
  // ✅ CORREGIDO: Usar datos directos del backend
  const profileImageUrl = response.profileImage?.url || null;
  const coverImageUrl = response.coverImage?.url || null;
  
  return {
    id_business: response.idCommerce,
    id_user: response.idOwner,
    name: response.name,
    description: response.description,
    email: response.email,
    phone: response.phone,
    link: response.link,
    branchOf: response.branchOf,
    profileImage: profileImageUrl,
    coverImage: coverImageUrl,
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
  
  const maxSize = 5 * 1024 * 1024;
  if (imageFile.size > maxSize) {
    throw new Error('La imagen no puede superar los 5MB');
  }
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(imageFile.type)) {
    throw new Error('Formato de imagen no válido. Usa JPG, PNG o WebP');
  }
  
  const formData = new FormData();
  formData.append('image', imageFile);
  
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
          'ngrok-skip-browser-warning': 'true', // ✅ Header para ngrok
        },
        timeout: 30000,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Respuesta del backend:', response.data);
    }
    
    await sleep(1000);
    const updatedBusiness = await getBusinessById(businessId);
    
    if (isDevelopment) {
      console.log('✅ Negocio actualizado:', updatedBusiness);
    }
    
    return {
      success: true,
      profileImage: updatedBusiness.profileImage,
      cloudinaryData: response.data
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
  formData.append('image', imageFile);
  
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
          'ngrok-skip-browser-warning': 'true', // ✅ Header para ngrok
        },
        timeout: 30000,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Respuesta del backend:', response.data);
    }
    
    await sleep(1000);
    const updatedBusiness = await getBusinessById(businessId);
    
    if (isDevelopment) {
      console.log('✅ Negocio actualizado:', updatedBusiness);
    }
    
    return {
      success: true,
      coverImage: updatedBusiness.coverImage,
      cloudinaryData: response.data
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
          'ngrok-skip-browser-warning': 'true', // ✅ Header para ngrok
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
// FUNCIONES DE PUBLICACIONES
// ============================================

/**
 * Obtener publicaciones de un comercio específico
 */
export const getPostsByCommerce = async (commerceId) => {
  validateParams({ commerceId }, ['commerceId']);
  
  try {
    if (isDevelopment) {
      console.log('📥 Obteniendo publicaciones del comercio:', commerceId);
    }
    
    const response = await apiRequest('GET', ENDPOINTS.POST_GET_BY_COMMERCE(commerceId));
    
    if (isDevelopment) {
      console.log('✅ Publicaciones obtenidas:', Array.isArray(response) ? response.length : 0);
    }
    
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message.includes('404')) {
      if (isDevelopment) {
        console.warn('⚠️ Endpoint no disponible, devolviendo array vacío');
      }
      return [];
    }
    throw error;
  }
};

/**
 * Crear publicación con imágenes
 */
export const createPost = async (description, idCommerce, imageFiles = [], eventData = null) => {
  validateParams({ description, idCommerce }, ['description', 'idCommerce']);
  
  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Debes subir al menos una imagen');
  }
  
  if (imageFiles.length > 10) {
    throw new Error('Máximo 10 imágenes por publicación');
  }
  
  const maxSize = 5 * 1024 * 1024;
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  for (const file of imageFiles) {
    if (!(file instanceof File)) {
      throw new Error('Uno de los archivos no es válido');
    }
    if (file.size > maxSize) {
      throw new Error(`La imagen "${file.name}" supera los 5MB`);
    }
    if (!validTypes.includes(file.type)) {
      throw new Error(`Formato inválido en "${file.name}". Usa JPG, PNG o WebP`);
    }
  }
  
  const formData = new FormData();
  formData.append('description', description.trim());
  formData.append('idCommerce', idCommerce);
  
  imageFiles.forEach(file => {
    formData.append('images', file);
  });
  
  if (eventData) {
    // TODO: Verificar si tu backend acepta estos campos
    // formData.append('date', eventData.date);
    // formData.append('time', eventData.time);
    // formData.append('location', eventData.location);
  }
  
  try {
    if (isDevelopment) {
      console.log('📤 Creando publicación:', {
        description: description.slice(0, 50) + '...',
        idCommerce,
        imageCount: imageFiles.length
      });
    }
    
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.POST_CREATE}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true', // ✅ Header para ngrok
        },
        timeout: 60000,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Publicación creada:', response.data);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'createPost');
  }
};

/**
 * Obtener todas las publicaciones
 */
export const getAllPosts = async () => {
  try {
    return await apiRequest('GET', ENDPOINTS.POST_GET_ALL);
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener publicación por ID
 */
export const getPostById = async (postId) => {
  validateParams({ postId }, ['postId']);
  return apiRequest('GET', ENDPOINTS.POST_GET_BY_ID(postId));
};

/**
 * Editar publicación (solo texto)
 */
export const updatePostText = async (postId, description, idCommerce) => {
  validateParams({ postId, description, idCommerce }, ['postId', 'description', 'idCommerce']);
  
  if (!description || description.trim() === '') {
    throw new Error('La descripción no puede estar vacía');
  }
  
  const dataToSend = {
    description: description.trim(),
    idCommerce: idCommerce,
  };
  
  if (isDevelopment) {
    console.log('📤 Editando texto de publicación:', postId, dataToSend);
  }
  
  const response = await apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), dataToSend);
  
  if (isDevelopment) {
    console.log('✅ Publicación actualizada:', response);
  }
  
  return normalizePostFromBackend(response);
};

/**
 * Editar publicación (deprecated - usar updatePostText)
 */
export const updatePost = async (postId, postData) => {
  validateParams({ postId, postData }, ['postId', 'postData']);
  
  if (!postData.description || postData.description.trim() === '') {
    throw new Error('La descripción no puede estar vacía');
  }
  
  const dataToSend = {
    description: postData.description.trim(),
    idCommerce: postData.idCommerce,
  };
  
  if (isDevelopment) {
    console.log('📤 Editando publicación:', postId, dataToSend);
  }
  
  return apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), dataToSend);
};

/**
 * Eliminar publicación
 */
export const deletePost = async (postId) => {
  validateParams({ postId }, ['postId']);
  
  if (isDevelopment) {
    console.log('🗑️ Eliminando publicación:', postId);
  }
  
  try {
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.POST_DELETE(postId)}`,
      {
        timeout: TIMEOUT,
        headers: {
          'ngrok-skip-browser-warning': 'true', // ✅ Header para ngrok
        },
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Publicación eliminada:', response.data);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'deletePost');
  }
};

/**
 * Agregar imágenes a publicación existente
 */
export const addImagesToPost = async (postId, imageFiles) => {
  validateParams({ postId, imageFiles }, ['postId', 'imageFiles']);
  
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
    throw new Error('Debes proporcionar al menos una imagen');
  }
  
  const formData = new FormData();
  imageFiles.forEach(file => {
    formData.append('images', file);
  });
  
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.POST_ADD_IMAGES(postId)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true', // ✅ Header para ngrok
        },
        timeout: 60000,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Imágenes agregadas a publicación:', response.data);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'addImagesToPost');
  }
};

/**
 * Eliminar imágenes de publicación
 */
export const deleteImagesFromPost = async (postId, imageIds) => {
  validateParams({ postId, imageIds }, ['postId', 'imageIds']);
  
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new Error('Debes proporcionar al menos un ID de imagen');
  }
  
  try {
    if (isDevelopment) {
      console.log('🗑️ Eliminando imágenes:', { postId, imageIds });
    }
    
    // ✅ CORREGIDO: Usar query parameters en lugar de body
    // El backend espera: /publicacion/eliminar/imagenes/{idPost}?imageIds=1&imageIds=2&imageIds=3
    const queryParams = imageIds.map(id => `imageIds=${id}`).join('&');
    
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.POST_DELETE_IMAGES(postId)}?${queryParams}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // ✅ Header para ngrok
        },
        timeout: TIMEOUT,
      }
    );
    
    if (isDevelopment) {
      console.log('✅ Imágenes eliminadas:', response.data);
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'deleteImagesFromPost');
  }
};

// ============================================
// FUNCIONES NORMALIZADORAS
// ============================================

/**
 * Normalizar publicación desde el backend
 */
export const normalizePostFromBackend = (post) => {
  // Si el backend devuelve el formato con imágenes como array de objetos
  if (post.images && Array.isArray(post.images)) {
    const sortedImages = post.images.sort((a, b) => a.imageOrder - b.imageOrder);
    
    return {
      id: post.idPost,
      text: post.description,
      images: sortedImages.map(img => img.url),
      imageDetails: sortedImages.map(img => ({
        id: img.idImage,
        url: img.url,
        order: img.imageOrder,
        publicId: img.publicId,
        originalFileName: img.originalFileName
      })),
      type: "post",
      businessName: post.nameCommerce,
      createdAt: post.postedAt,
    };
  }
  
  // Fallback para formato simple
  return {
    id: post.idPost || post.id,
    text: post.description || post.text,
    images: Array.isArray(post.images) ? post.images : [],
    imageDetails: [],
    type: "post",
    businessName: post.nameCommerce || post.businessName,
    createdAt: post.postedAt || post.createdAt,
  };
};

// ============================================
// FUNCIONES DE BÚSQUEDA
// ============================================

/**
 * Buscar comercios por nombre o tag
 */
export const searchCommerces = async (searchParam, limit = 10, offset = 0) => {
  if (!searchParam || searchParam.trim() === '') {
    throw new Error('Debes ingresar un término de búsqueda');
  }

  const params = new URLSearchParams({
    searchParam: searchParam.trim(),
    limit: limit.toString(),
    offset: offset.toString()
  });

  try {
    if (isDevelopment) {
      console.log('🔍 Buscando comercios:', { searchParam, limit, offset });
    }

    const response = await apiRequest('GET', `${ENDPOINTS.SEARCH_COMMERCES}?${params}`);
    
    if (isDevelopment) {
      console.log('✅ Resultados encontrados:', Array.isArray(response) ? response.length : 0);
    }

    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (isDevelopment) {
      console.error('❌ Error en búsqueda:', error);
    }
    throw error;
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

  // Búsqueda  
  searchCommerces,
  
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
  
  // Publicaciones
  createPost,
  getAllPosts,
  getPostById,
  getPostsByCommerce,
  updatePost,
  updatePostText,
  deletePost,
  addImagesToPost,
  deleteImagesFromPost,
  normalizePostFromBackend,
  
  // Utilidades
  generateUsername,
  capitalizeFirstLetter,
  validateEmail,
  validatePasswordStrength,
};