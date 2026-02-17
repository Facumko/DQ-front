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
  REFRESH_TOKEN: '/auth/refresh', 
  
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
// 🆕 GESTIÓN DE TOKENS JWT
// ============================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const getStoredTokens = () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

export const saveTokens = (accessToken, refreshToken) => {
  try {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setAuthToken(accessToken);
  } catch (error) {
    console.error('Error guardando tokens:', error);
  }
};

export const clearTokens = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuthToken(null);
  } catch (error) {
    console.error('Error limpiando tokens:', error);
  }
};

// 🆕 Función para refrescar el token
const refreshAccessToken = async () => {
  const { refreshToken } = getStoredTokens();
  
  console.log('🔄 ========== INICIO REFRESH TOKEN ==========');
  console.log('🔍 1. refreshToken obtenido de localStorage:', refreshToken ? '✅ Existe' : '❌ NULL');
  console.log('🔍 2. Primeros 30 caracteres:', refreshToken ? refreshToken.substring(0, 30) : 'N/A');
  console.log('🔍 3. Longitud total:', refreshToken?.length);
  console.log('🔍 4. Tipo de dato:', typeof refreshToken);
  
  if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null' || refreshToken.trim() === '') {
    console.error('❌ refreshToken inválido');
    clearTokens();
    throw new Error('No hay refresh token disponible');
  }

  // 🆕 CREAR PAYLOAD Y VERIFICAR
  const payload = { refreshToken: refreshToken };
  
  console.log('🔍 5. Payload creado:', payload);
  console.log('🔍 6. Payload.refreshToken existe?:', !!payload.refreshToken);
  console.log('🔍 7. JSON.stringify del payload:', JSON.stringify(payload));

  try {
    console.log('📤 8. Enviando request a:', `${API_URL}${ENDPOINTS.REFRESH_TOKEN}`);
    console.log('📤 9. Headers que se enviarán:', {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    });
    
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.REFRESH_TOKEN}`, 
      payload, // { refreshToken: "eyJhbG..." }
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: 10000,
      }
    );

    console.log('✅ 10. Respuesta exitosa del backend:', response.data);
    console.log('✅ 11. Status code:', response.status);

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    if (!accessToken) {
      throw new Error('Backend no devolvió accessToken');
    }
    
    saveTokens(accessToken, newRefreshToken || refreshToken);
    
    console.log('✅ ========== FIN REFRESH TOKEN EXITOSO ==========');
    return accessToken;
    
  } catch (error) {
    console.error('❌ ========== ERROR EN REFRESH TOKEN ==========');
    console.error('❌ Error completo:', error);
    console.error('❌ Error.message:', error.message);
    console.error('❌ Error.response:', error.response);
    console.error('❌ Error.response.data:', error.response?.data);
    console.error('❌ Error.response.status:', error.response?.status);
    console.error('❌ Error.config.data:', error.config?.data);
    console.error('❌ ================================================');
    clearTokens();
    throw error;
  }
};
// ============================================
// INTERCEPTORES DE AXIOS
// ============================================

// 🆕 Request Interceptor - Agregar token automáticamente
axios.interceptors.request.use(
  (config) => {

    if (config.url.includes('/auth/refresh')) {
      console.log('🔍 INTERCEPTOR REQUEST - URL:', config.url);
      console.log('🔍 INTERCEPTOR REQUEST - Body:', config.data);
      console.log('🔍 INTERCEPTOR REQUEST - Body tipo:', typeof config.data);
      console.log('🔍 INTERCEPTOR REQUEST - Body stringificado:', JSON.stringify(config.data));
    }
    // No agregar token a endpoints públicos
    const publicEndpoints = [
      ENDPOINTS.LOGIN,
      ENDPOINTS.REGISTER,
      ENDPOINTS.REFRESH_TOKEN
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🆕 Response Interceptor - Manejar 401 y refresh automático
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es refresh token endpoint
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes(ENDPOINTS.REFRESH_TOKEN)) {
        clearTokens();
        window.location.href = '/';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// CONFIGURACIÓN GLOBAL DE AXIOS
// ============================================

axios.defaults.timeout = TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
axios.defaults.withCredentials = false;

// Cargar token al iniciar
const { accessToken } = getStoredTokens();
if (accessToken) {
  setAuthToken(accessToken);
}

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

const validateApiResponse = (response, endpoint) => {
  if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
    throw new Error(`El servidor respondió con una página HTML en lugar de datos JSON. Posible problema de CORS en el endpoint: ${endpoint}`);
  }
  
  if (typeof response === 'string' && response.includes('ngrok')) {
    throw new Error(`Ngrok está bloqueando la petición. Verifica la configuración de CORS. Endpoint: ${endpoint}`);
  }
  
  return true;
};

const handleApiError = (error, endpoint) => {
  if (isDevelopment) {
    console.error(`❌ Error en ${endpoint}:`, error);
  }
  
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

const apiRequest = async (method, endpoint, data = null, retries = MAX_RETRIES) => {
  logRequest(method, endpoint, data);
  
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Access-Control-Allow-Origin': '*',
    },
    withCredentials: false,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.data = data;
  }

  try {
    const response = await axios(config);
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
// FUNCIONES DE AUTENTICACIÓN - 🆕 ACTUALIZADAS
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
    
    // 🆕 Guardar tokens JWT
    if (response.accessToken && response.refreshToken) {
      saveTokens(response.accessToken, response.refreshToken);
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
    
    // 🆕 Guardar tokens JWT
    if (response.accessToken && response.refreshToken) {
      saveTokens(response.accessToken, response.refreshToken);
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
      
      // 🆕 Guardar tokens JWT en retry
      if (retryResponse.accessToken && retryResponse.refreshToken) {
        saveTokens(retryResponse.accessToken, retryResponse.refreshToken);
      }
      
      return retryResponse;
    }
    
    throw error;
  }
};

export const logoutUser = async (userId) => {
  try {
    const response = await apiRequest('POST', ENDPOINTS.LOGOUT, { userId });
    // 🆕 Limpiar tokens JWT
    clearTokens();
    return response;
  } catch (error) {
    if (isDevelopment) {
      console.warn('Error en logout del backend, limpiando sesión local:', error.message);
    }
    // 🆕 Limpiar tokens JWT incluso si falla
    clearTokens();
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
  
  if (!businessData.idOwner) {
    console.log("❌ FALTA idOwner en businessData:", businessData);
    throw new Error('El ID de usuario es obligatorio');
  }
  
  const dataToSend = {
    name: businessData.name.trim(),
    description: businessData.description.trim(),
    phone: businessData.phone?.trim() || '',
    website: businessData.website?.trim() || '',
    instagram: businessData.instagram?.trim() || null,
    facebook: businessData.facebook?.trim() || null,
    whatsapp: businessData.whatsapp?.trim() || null,
    email: businessData.email?.trim() || '',
    branchOf: businessData.branchOf || null,
    idOwner: Number(businessData.idOwner),
  };
  
  console.log("📤 Enviando al backend (formato CommerceDto):", dataToSend);
  console.log("🔗 URL completa:", `${API_URL}${ENDPOINTS.CREATE_BUSINESS}`);
  
  try {
    const response = await apiRequest('POST', ENDPOINTS.CREATE_BUSINESS, dataToSend);
    console.log("📦 Respuesta del backend:", response);
    
    return {
      id_business: response.idCommerce,
      id_user: response.idOwner,
      name: response.name,
      description: response.description,
      email: response.email,
      phone: response.phone,
      website: response.website,
      instagram: response.instagram,
      facebook: response.facebook,
      whatsapp: response.whatsapp,
      branchOf: response.branchOf,
      profileImage: response.profileImage?.url || null,
      coverImage: response.coverImage?.url || null,
    };
  } catch (error) {
    console.error("❌ Error en createBusiness:", error);
    throw error;
  }
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
          'ngrok-skip-browser-warning': 'true',
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
          'ngrok-skip-browser-warning': 'true',
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
          'ngrok-skip-browser-warning': 'true',
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
          'ngrok-skip-browser-warning': 'true',
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

export const getAllPosts = async () => {
  try {
    return await apiRequest('GET', ENDPOINTS.POST_GET_ALL);
  } catch (error) {
    throw error;
  }
};

export const getPostById = async (postId) => {
  validateParams({ postId }, ['postId']);
  return apiRequest('GET', ENDPOINTS.POST_GET_BY_ID(postId));
};

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
          'ngrok-skip-browser-warning': 'true',
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
          'ngrok-skip-browser-warning': 'true',
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

export const deleteImagesFromPost = async (postId, imageIds) => {
  validateParams({ postId, imageIds }, ['postId', 'imageIds']);
  
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new Error('Debes proporcionar al menos un ID de imagen');
  }
  
  try {
    if (isDevelopment) {
      console.log('🗑️ Eliminando imágenes:', { postId, imageIds });
    }
    
    const queryParams = imageIds.map(id => `imageIds=${id}`).join('&');
    
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.POST_DELETE_IMAGES(postId)}?${queryParams}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
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

export const normalizePostFromBackend = (post) => {
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
  
  // JWT 🆕
  setAuthToken,
  getStoredTokens,
  saveTokens,
  clearTokens,
  
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