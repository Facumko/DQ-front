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
  LOGIN: '/auth/login',
  REGISTER: '/auth/registrarse',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  GET_USER: (id) => `/usuario/traer/${id}`,
  UPDATE_USER: (id) => `/usuario/editar/${id}`,
  DELETE_USER: (id) => `/usuario/eliminar/${id}`,
  GET_CATEGORIES: '/categoria/traer',
  GET_IMAGES: '/imagen/traer',
  UPLOAD_IMAGE: '/imagen/guardar',
  GET_ALL_COMMERCES: '/comercio/traer',
  GET_BUSINESS_BY_USER: (userId) => `/comercio/traer/usuario/${userId}`,
  GET_BUSINESS: (businessId) => `/comercio/traer/${businessId}`,
  UPDATE_BUSINESS: (businessId) => `/comercio/editar/${businessId}`,
  CREATE_BUSINESS: '/comercio/guardar',
  UPLOAD_PROFILE_IMAGE: (businessId) => `/comercio/establecer/imagen/perfil/${businessId}`,
  UPLOAD_COVER_IMAGE: (businessId) => `/comercio/establecer/imagen/portada/${businessId}`,
  UPLOAD_GALLERY_IMAGES: (businessId) => `/comercio/agregar/imagenes/galeria/${businessId}`,
  POST_CREATE: '/publicacion/crear',
  POST_GET_ALL: '/publicacion/traer',
  POST_GET_BY_ID: (postId) => `/publicacion/traer/${postId}`,
  POST_GET_BY_COMMERCE: (commerceId) => `/publicacion/traer/comercio/${commerceId}`,
  POST_UPDATE: (postId) => `/publicacion/editar/${postId}`,
  POST_DELETE: (postId) => `/publicacion/eliminar/${postId}`,
  POST_ADD_IMAGES: (postId) => `/publicacion/agregar/imagenes/${postId}`,
  POST_DELETE_IMAGES: (postId) => `/publicacion/eliminar/imagenes/${postId}`,
  SEARCH_COMMERCES: '/comercio/buscar',
  MAIN_FEED: '/main/feed',
  // Favoritos
  FAV_COMMERCE_ADD:    (idUser, idCommerce) => `/usuario/agregar/comercio/fav/${idUser}/${idCommerce}`,
  FAV_COMMERCE_REMOVE: (idUser, idCommerce) => `/usuario/eliminar/comercio/fav/${idUser}/${idCommerce}`,
  FAV_COMMERCES_GET:   (idUser)             => `/usuario/traer/comercios/fav${idUser}`,
  SAVED_POST_ADD:      (idUser, idPost)     => `/usuario/guardar/post/${idUser}/${idPost}`,
  SAVED_POST_REMOVE:   (idUser, idPost)     => `/usuario/eliminar/post/guardado/${idUser}/${idPost}`,
  SAVED_POSTS_GET:     (idUser)             => `/usuario/traer/posts/guardados/${idUser}`,
};

// ============================================
// GESTIÓN DE TOKENS JWT
// ============================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) { prom.reject(error); } else { prom.resolve(token); }
  });
  failedQueue = [];
};

export const setAuthToken = (token) => {
  if (token) { axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
  else { delete axios.defaults.headers.common['Authorization']; }
};

export const getStoredTokens = () => {
  try {
    return {
      accessToken:  localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
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

const refreshAccessToken = async () => {
  const { refreshToken } = getStoredTokens();

  if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null' || refreshToken.trim() === '') {
    clearTokens();
    throw new Error('No hay refresh token disponible');
  }

  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.REFRESH_TOKEN}`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        timeout: 10000,
      }
    );
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    if (!accessToken) throw new Error('Backend no devolvió accessToken');
    saveTokens(accessToken, newRefreshToken || refreshToken);
    return accessToken;
  } catch (error) {
    clearTokens();
    throw error;
  }
};

// ============================================
// INTERCEPTORES DE AXIOS
// ============================================

axios.interceptors.request.use(
  (config) => {
    const publicEndpoints = [ENDPOINTS.LOGIN, ENDPOINTS.REGISTER, ENDPOINTS.REFRESH_TOKEN];
    const isPublicEndpoint = publicEndpoints.some(ep => config.url.includes(ep));
    if (!isPublicEndpoint) {
      const { accessToken } = getStoredTokens();
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        setAuthToken(newToken);
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
axios.defaults.withCredentials = false;

const { accessToken: _initToken } = getStoredTokens();
if (_initToken) setAuthToken(_initToken);

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

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePasswordStrength = (password) => {
  if (!password) return { strength: 'none', message: '' };
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ].filter(Boolean).length;
  if (score <= 2) return { strength: 'weak',   message: 'Contraseña débil',  color: '#ff4444' };
  if (score <= 3) return { strength: 'medium', message: 'Contraseña media',  color: '#ffaa00' };
  return              { strength: 'strong', message: 'Contraseña fuerte', color: '#00cc66' };
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const shouldRetry = (error) => {
  if (error.response?.status === 401) return false;
  if (!error.response) return true;
  if (error.code === 'ECONNABORTED') return true;
  if (error.response.status >= 500) return true;
  return false;
};

const validateApiResponse = (response, endpoint) => {
  if (typeof response === 'string' && response.includes('<!DOCTYPE html>'))
    throw new Error(`El servidor respondió con HTML en lugar de JSON. Endpoint: ${endpoint}`);
  if (typeof response === 'string' && response.includes('ngrok'))
    throw new Error(`Ngrok está bloqueando la petición. Endpoint: ${endpoint}`);
  return true;
};

const handleApiError = (error, endpoint) => {
  if (isDevelopment) console.error(`❌ Error en ${endpoint}:`, error);
  if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>'))
    return new Error(`🔒 Ngrok está bloqueando la petición. Endpoint: ${endpoint}`);
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return new Error('⏱️ La petición tardó demasiado tiempo.');
    return new Error(`🔌 No se pudo conectar al servidor en ${API_URL}`);
  }
  const { status, data } = error.response;
  const serverMessage = data?.message || data?.error;
  const errorMessages = {
    400: 'Datos inválidos. Por favor revisa la información ingresada.',
    401: 'Credenciales incorrectas.',
    403: 'No tenés permisos para realizar esta acción.',
    404: 'Recurso no encontrado.',
    409: 'Ya existe un registro con estos datos.',
    422: 'Error de validación.',
    500: 'Error interno del servidor.',
    502: 'Servidor no disponible.',
    503: 'Servicio temporalmente no disponible.',
  };
  return new Error(serverMessage || errorMessages[status] || `Error ${status}`);
};

const validateParams = (params, paramNames) => {
  for (const name of paramNames) {
    if (params[name] === null || params[name] === undefined || params[name] === '')
      throw new Error(`Parámetro requerido faltante: ${name}`);
  }
};

const logRequest = (method, endpoint, data) => {
  if (isDevelopment) console.log(`🌐 ${method} ${endpoint}`, data || '');
};

const logResponse = (method, endpoint, data) => {
  if (isDevelopment) console.log(`✅ ${method} ${endpoint} - Success`, data);
};

const apiRequest = async (method, endpoint, data = null, retries = MAX_RETRIES) => {
  logRequest(method, endpoint, data);
  const { accessToken } = getStoredTokens();
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    },
    withCredentials: false,
  };
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) config.data = data;
  try {
    const response = await axios(config);
    validateApiResponse(response.data, endpoint);
    logResponse(method, endpoint, response.data);
    return response.data;
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      const attemptNumber = MAX_RETRIES - retries + 1;
      if (isDevelopment) console.warn(`⚠️ Reintentando... (Intento ${attemptNumber}/${MAX_RETRIES})`);
      await sleep(1000 * attemptNumber);
      return apiRequest(method, endpoint, data, retries - 1);
    }
    throw handleApiError(error, endpoint);
  }
};

// ============================================
// AUTENTICACIÓN
// ============================================

export const loginUser = async (email, password) => {
  validateParams({ email, password }, ['email', 'password']);
  if (!validateEmail(email)) throw new Error('Por favor ingresá un email válido');
  const response = await apiRequest('POST', ENDPOINTS.LOGIN, { email, password });
  if (!response || !response.idUser) throw new Error('Respuesta inválida del servidor: falta ID de usuario');
  if (response.accessToken && response.refreshToken) saveTokens(response.accessToken, response.refreshToken);
  return response;
};

export const registerUser = async (userData) => {
  validateParams(userData, ['email', 'password']);
  if (!validateEmail(userData.email)) throw new Error('Por favor ingresá un email válido');
  if (userData.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

  const registrationData = {
    email:          userData.email,
    password:       userData.password,
    username:       userData.username || generateUsername(userData.email),
    name:           userData.name || capitalizeFirstLetter(userData.email.split('@')[0]),
    lastname:       userData.lastname || '',
    recovery_email: userData.recovery_email || userData.email,
  };

  try {
    const response = await apiRequest('POST', ENDPOINTS.REGISTER, registrationData);
    if (!response) throw new Error('Respuesta inválida del servidor');
    if (response.accessToken && response.refreshToken) saveTokens(response.accessToken, response.refreshToken);
    return response;
  } catch (error) {
    if (error.message.includes('duplicado') || error.message.includes('409')) {
      if (isDevelopment) console.log('Username duplicado, reintentando...');
      registrationData.username = generateUsername(userData.email);
      const retryResponse = await apiRequest('POST', ENDPOINTS.REGISTER, registrationData);
      if (!retryResponse) throw new Error('Respuesta inválida del servidor');
      if (retryResponse.accessToken && retryResponse.refreshToken) saveTokens(retryResponse.accessToken, retryResponse.refreshToken);
      return retryResponse;
    }
    throw error;
  }
};

export const logoutUser = async (userId) => {
  try {
    const response = await apiRequest('POST', ENDPOINTS.LOGOUT, { userId });
    clearTokens();
    return response;
  } catch (error) {
    if (isDevelopment) console.warn('Error en logout del backend:', error.message);
    clearTokens();
    return { success: true, message: 'Sesión cerrada localmente' };
  }
};

// ============================================
// USUARIO
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
// CATEGORÍAS
// ============================================

export const getCategories = async () => apiRequest('GET', ENDPOINTS.GET_CATEGORIES);

// ============================================
// IMÁGENES (antiguas)
// ============================================

export const getImages = async () => apiRequest('GET', ENDPOINTS.GET_IMAGES);

export const uploadImage = async (imageData) => {
  validateParams({ imageData }, ['imageData']);
  return apiRequest('POST', ENDPOINTS.UPLOAD_IMAGE, imageData);
};

// ============================================
// HELPER: construir AddressDto desde LocationPicker
// ============================================

const buildAddressDto = (location) => {
  if (!location || (!location.lat && !location.lng)) return null;
  return {
    address:  location.address || "",
    street:   "",
    district: "",
    location: "",
    lat:      location.lat  ?? null,
    lng:      location.lng  ?? null,
  };
};

// ============================================
// NEGOCIOS
// ============================================

export const getAllCommerces = async () => {
  try {
    if (isDevelopment) console.log('📦 Trayendo todos los comercios...');
    const response = await apiRequest('GET', ENDPOINTS.GET_ALL_COMMERCES);
    if (isDevelopment) console.log('✅ Comercios obtenidos:', Array.isArray(response) ? response.length : 0);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (isDevelopment) console.error('❌ Error trayendo comercios:', error);
    throw error;
  }
};

export const getBusinessByUserId = async (userId) => {
  validateParams({ userId }, ['userId']);
  try {
    const response = await apiRequest('GET', ENDPOINTS.GET_BUSINESS_BY_USER(userId));
    const business = Array.isArray(response) ? response[0] : response;
    if (!business) return null;
    return {
      id_business:  business.idCommerce,
      id_user:      business.idOwner,
      name:         business.name,
      description:  business.description,
      email:        business.email,
      phone:        business.phone,
      link:         business.link,
      branchOf:     business.branchOf,
      profileImage: business.profileImage?.url || null,
      coverImage:   business.coverImage?.url   || null,
      location: business.address?.lat ? {
        lat:     parseFloat(business.address.lat),
        lng:     parseFloat(business.address.lng),
        address: business.address.address || business.address.street || "",
      } : null,
    };
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('no encontrado')) {
      if (isDevelopment) console.log("ℹ️ El usuario no tiene negocio creado (404)");
      return null;
    }
    throw error;
  }
};

export const getBusinessById = async (businessId) => {
  validateParams({ businessId }, ['businessId']);
  const response = await apiRequest('GET', ENDPOINTS.GET_BUSINESS(businessId));
  const business = Array.isArray(response) ? response[0] : response;
  if (!business) throw new Error('Negocio no encontrado');
  if (isDevelopment) console.log("🖼️ Datos del negocio completo:", business);
  return {
    id_business:  business.idCommerce,
    id_user:      business.idOwner,
    name:         business.name        || '',
    description:  business.description || '',
    email:        business.email       || '',
    phone:        business.phone       || '',
    link:         business.link        || '',
    branchOf:     business.branchOf    || null,
    profileImage: business.profileImage?.url || null,
    coverImage:   business.coverImage?.url   || null,
    location: business.address?.lat ? {
      lat:     parseFloat(business.address.lat),
      lng:     parseFloat(business.address.lng),
      address: business.address.address || business.address.street || "",
    } : null,
  };
};

export const createBusiness = async (businessData) => {
  validateParams({ businessData }, ['businessData']);
  if (!businessData.name?.trim())        throw new Error('El nombre del negocio es obligatorio');
  if (!businessData.description?.trim()) throw new Error('La descripción del negocio es obligatoria');
  if (!businessData.idOwner)             throw new Error('El ID de usuario es obligatorio');

  const dataToSend = {
    name:        businessData.name.trim(),
    description: businessData.description.trim(),
    phone:       businessData.phone?.trim()     || '',
    website:     businessData.website?.trim()   || '',
    instagram:   businessData.instagram?.trim() || null,
    facebook:    businessData.facebook?.trim()  || null,
    whatsapp:    businessData.whatsapp?.trim()  || null,
    email:       businessData.email?.trim()     || '',
    branchOf:    businessData.branchOf          || null,
    idOwner:     Number(businessData.idOwner),
    address:     buildAddressDto(businessData.location),
  };

  if (isDevelopment) {
    console.log("📤 Enviando al backend (createBusiness):", dataToSend);
    console.log("🗺️ Address enviada:", dataToSend.address);
  }

  try {
    const response = await apiRequest('POST', ENDPOINTS.CREATE_BUSINESS, dataToSend);
    return {
      id_business:  response.idCommerce,
      id_user:      response.idOwner,
      name:         response.name,
      description:  response.description,
      email:        response.email,
      phone:        response.phone,
      website:      response.website,
      instagram:    response.instagram,
      facebook:     response.facebook,
      whatsapp:     response.whatsapp,
      branchOf:     response.branchOf,
      profileImage: response.profileImage?.url || null,
      coverImage:   response.coverImage?.url   || null,
      location: response.address?.lat ? {
        lat:     parseFloat(response.address.lat),
        lng:     parseFloat(response.address.lng),
        address: response.address.address || "",
      } : null,
    };
  } catch (error) {
    console.error("❌ Error en createBusiness:", error);
    throw error;
  }
};

export const updateBusiness = async (businessId, businessData) => {
  validateParams({ businessId, businessData }, ['businessId', 'businessData']);
  if (businessData.name !== undefined        && businessData.name.trim() === '')        throw new Error('El nombre del negocio no puede estar vacío');
  if (businessData.description !== undefined && businessData.description.trim() === '') throw new Error('La descripción del negocio no puede estar vacía');

  const dataToSend = {};
  if (businessData.name        !== undefined) dataToSend.name        = businessData.name.trim();
  if (businessData.description !== undefined) dataToSend.description = businessData.description.trim();
  if (businessData.email       !== undefined) dataToSend.email       = businessData.email.trim();
  if (businessData.phone       !== undefined) dataToSend.phone       = businessData.phone.trim();
  if (businessData.link        !== undefined) dataToSend.link        = businessData.link.trim();
  if (businessData.website     !== undefined) dataToSend.website     = businessData.website.trim();
  if (businessData.instagram   !== undefined) dataToSend.instagram   = businessData.instagram?.trim() || null;
  if (businessData.facebook    !== undefined) dataToSend.facebook    = businessData.facebook?.trim()  || null;
  if (businessData.branchOf    !== undefined) dataToSend.branchOf    = businessData.branchOf;
  if (businessData.location    !== undefined) {
    dataToSend.address = buildAddressDto(businessData.location);
    if (isDevelopment) console.log("🗺️ Address enviada en update:", dataToSend.address);
  }

  if (isDevelopment) console.log("📤 Actualizando negocio:", businessId, dataToSend);

  const response = await apiRequest('PUT', ENDPOINTS.UPDATE_BUSINESS(businessId), dataToSend);

  if (isDevelopment) console.log("📦 Respuesta del backend:", response);

  return {
    id_business:  response.idCommerce,
    id_user:      response.idOwner,
    name:         response.name,
    description:  response.description,
    email:        response.email,
    phone:        response.phone,
    link:         response.link,
    branchOf:     response.branchOf,
    profileImage: response.profileImage?.url || null,
    coverImage:   response.coverImage?.url   || null,
    location: response.address?.lat ? {
      lat:     parseFloat(response.address.lat),
      lng:     parseFloat(response.address.lng),
      address: response.address.address || "",
    } : null,
  };
};

// ============================================
// IMÁGENES DE COMERCIO
// ============================================

export const uploadProfileImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  if (!(imageFile instanceof File)) throw new Error('Debes proporcionar un archivo de imagen válido');
  if (imageFile.size > 5 * 1024 * 1024) throw new Error('La imagen no puede superar los 5MB');
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imageFile.type))
    throw new Error('Formato inválido. Usá JPG, PNG o WebP');
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.UPLOAD_PROFILE_IMAGE(businessId)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, timeout: 30000 }
    );
    await sleep(1000);
    const updatedBusiness = await getBusinessById(businessId);
    return { success: true, profileImage: updatedBusiness.profileImage, cloudinaryData: response.data };
  } catch (error) { throw handleApiError(error, 'uploadProfileImage'); }
};

export const uploadCoverImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  if (!(imageFile instanceof File)) throw new Error('Debes proporcionar un archivo de imagen válido');
  if (imageFile.size > 5 * 1024 * 1024) throw new Error('La imagen no puede superar los 5MB');
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imageFile.type))
    throw new Error('Formato inválido. Usá JPG, PNG o WebP');
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.UPLOAD_COVER_IMAGE(businessId)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, timeout: 30000 }
    );
    await sleep(1000);
    const updatedBusiness = await getBusinessById(businessId);
    return { success: true, coverImage: updatedBusiness.coverImage, cloudinaryData: response.data };
  } catch (error) { throw handleApiError(error, 'uploadCoverImage'); }
};

export const uploadGalleryImages = async (businessId, imageFiles) => {
  validateParams({ businessId, imageFiles }, ['businessId', 'imageFiles']);
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) throw new Error('Debes proporcionar al menos una imagen');
  if (imageFiles.length > 10) throw new Error('Máximo 10 imágenes por vez');
  for (const file of imageFiles) {
    if (file.size > 5 * 1024 * 1024) throw new Error(`La imagen "${file.name}" supera los 5MB`);
  }
  const formData = new FormData();
  imageFiles.forEach(file => formData.append('files', file));
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.UPLOAD_GALLERY_IMAGES(businessId)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, timeout: 60000 }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'uploadGalleryImages'); }
};

// ============================================
// PUBLICACIONES
// ============================================

export const getPostsByCommerce = async (commerceId) => {
  validateParams({ commerceId }, ['commerceId']);
  try {
    const response = await apiRequest('GET', ENDPOINTS.POST_GET_BY_COMMERCE(commerceId));
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message.includes('404')) return [];
    throw error;
  }
};

export const createPost = async (description, idCommerce, imageFiles = [], eventData = null) => {
  validateParams({ description, idCommerce }, ['description', 'idCommerce']);
  if (!imageFiles || imageFiles.length === 0) throw new Error('Debes subir al menos una imagen');
  if (imageFiles.length > 10) throw new Error('Máximo 10 imágenes por publicación');
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  for (const file of imageFiles) {
    if (!(file instanceof File)) throw new Error('Uno de los archivos no es válido');
    if (file.size > 5 * 1024 * 1024) throw new Error(`La imagen "${file.name}" supera los 5MB`);
    if (!validTypes.includes(file.type)) throw new Error(`Formato inválido en "${file.name}". Usá JPG, PNG o WebP`);
  }
  const formData = new FormData();
  formData.append('description', description.trim());
  formData.append('idCommerce', idCommerce);
  imageFiles.forEach(file => formData.append('images', file));
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.POST_CREATE}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, timeout: 60000 }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'createPost'); }
};

export const getAllPosts = async () => apiRequest('GET', ENDPOINTS.POST_GET_ALL);

export const getPostById = async (postId) => {
  validateParams({ postId }, ['postId']);
  return apiRequest('GET', ENDPOINTS.POST_GET_BY_ID(postId));
};

export const updatePostText = async (postId, description, idCommerce) => {
  validateParams({ postId, description, idCommerce }, ['postId', 'description', 'idCommerce']);
  if (!description?.trim()) throw new Error('La descripción no puede estar vacía');
  const response = await apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), {
    description: description.trim(),
    idCommerce,
  });
  return normalizePostFromBackend(response);
};

export const updatePost = async (postId, postData) => {
  validateParams({ postId, postData }, ['postId', 'postData']);
  if (!postData.description?.trim()) throw new Error('La descripción no puede estar vacía');
  return apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), {
    description: postData.description.trim(),
    idCommerce:  postData.idCommerce,
  });
};

export const deletePost = async (postId) => {
  validateParams({ postId }, ['postId']);
  try {
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.POST_DELETE(postId)}`,
      { timeout: TIMEOUT, headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'deletePost'); }
};

export const addImagesToPost = async (postId, imageFiles) => {
  validateParams({ postId, imageFiles }, ['postId', 'imageFiles']);
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) throw new Error('Debes proporcionar al menos una imagen');
  const formData = new FormData();
  imageFiles.forEach(file => formData.append('images', file));
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.POST_ADD_IMAGES(postId)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, timeout: 60000 }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'addImagesToPost'); }
};

export const deleteImagesFromPost = async (postId, imageIds) => {
  validateParams({ postId, imageIds }, ['postId', 'imageIds']);
  if (!Array.isArray(imageIds) || imageIds.length === 0) throw new Error('Debes proporcionar al menos un ID de imagen');
  try {
    const queryParams = imageIds.map(id => `imageIds=${id}`).join('&');
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.POST_DELETE_IMAGES(postId)}?${queryParams}`,
      { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: TIMEOUT }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'deleteImagesFromPost'); }
};

// ============================================
// NORMALIZADORES
// ============================================

export const normalizePostFromBackend = (post) => {
  if (post.images && Array.isArray(post.images)) {
    const sortedImages = post.images.sort((a, b) => a.imageOrder - b.imageOrder);
    return {
      id:           post.idPost,
      text:         post.description,
      images:       sortedImages.map(img => img.url),
      imageDetails: sortedImages.map(img => ({
        id:               img.idImage,
        url:              img.url,
        order:            img.imageOrder,
        publicId:         img.publicId,
        originalFileName: img.originalFileName,
      })),
      type:         "post",
      businessName: post.nameCommerce,
      createdAt:    post.postedAt,
    };
  }
  return {
    id:           post.idPost || post.id,
    text:         post.description || post.text,
    images:       Array.isArray(post.images) ? post.images : [],
    imageDetails: [],
    type:         "post",
    businessName: post.nameCommerce || post.businessName,
    createdAt:    post.postedAt || post.createdAt,
  };
};

// ============================================
// BÚSQUEDA
// ============================================

export const searchCommerces = async (searchParam, limit = 10, offset = 0) => {
  if (!searchParam || searchParam.trim() === '') throw new Error('Debes ingresar un término de búsqueda');
  const params = new URLSearchParams({
    searchParam: searchParam.trim(),
    limit:       limit.toString(),
    offset:      offset.toString(),
  });
  try {
    const response = await apiRequest('GET', `${ENDPOINTS.SEARCH_COMMERCES}?${params}`);
    return Array.isArray(response) ? response : [];
  } catch (error) { throw error; }
};

// ============================================
// FEED PRINCIPAL
// ============================================

export const getMainFeed = async (page = 0, size = 10) => {
  try {
    if (isDevelopment) console.log(`📰 Cargando feed principal: página ${page}, tamaño ${size}`);
    const response = await apiRequest('GET', `${ENDPOINTS.MAIN_FEED}?page=${page}&size=${size}`);
    if (isDevelopment) console.log(`✅ Feed obtenido: ${Array.isArray(response) ? response.length : 0} items`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (isDevelopment) console.error('❌ Error cargando feed:', error);
    throw error;
  }
};

// ============================================
// FAVORITOS Y POSTS GUARDADOS
// ============================================

export const getFavoriteCommerces = async (idUser) => {
  validateParams({ idUser }, ['idUser']);
  try {
    const response = await apiRequest('GET', ENDPOINTS.FAV_COMMERCES_GET(idUser));
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message.includes('404')) return [];
    throw error;
  }
};

export const addFavoriteCommerce = async (idUser, idCommerce) => {
  validateParams({ idUser, idCommerce }, ['idUser', 'idCommerce']);
  return apiRequest('POST', ENDPOINTS.FAV_COMMERCE_ADD(idUser, idCommerce));
};

export const removeFavoriteCommerce = async (idUser, idCommerce) => {
  validateParams({ idUser, idCommerce }, ['idUser', 'idCommerce']);
  return apiRequest('POST', ENDPOINTS.FAV_COMMERCE_REMOVE(idUser, idCommerce));
};

export const getSavedPosts = async (idUser) => {
  validateParams({ idUser }, ['idUser']);
  try {
    const response = await apiRequest('GET', ENDPOINTS.SAVED_POSTS_GET(idUser));
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message.includes('404')) return [];
    throw error;
  }
};

export const addSavedPost = async (idUser, idPost) => {
  validateParams({ idUser, idPost }, ['idUser', 'idPost']);
  return apiRequest('POST', ENDPOINTS.SAVED_POST_ADD(idUser, idPost));
};

export const removeSavedPost = async (idUser, idPost) => {
  validateParams({ idUser, idPost }, ['idUser', 'idPost']);
  return apiRequest('POST', ENDPOINTS.SAVED_POST_REMOVE(idUser, idPost));
};

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================

export default {
  loginUser, registerUser, logoutUser,
  setAuthToken, getStoredTokens, saveTokens, clearTokens,
  getUserById, updateUser, deleteUser,
  searchCommerces,
  getCategories,
  getImages, uploadImage,
  getAllCommerces,
  getBusinessByUserId, getBusinessById, createBusiness, updateBusiness,
  uploadProfileImage, uploadCoverImage, uploadGalleryImages,
  createPost, getAllPosts, getPostById, getPostsByCommerce,
  updatePost, updatePostText, deletePost, addImagesToPost, deleteImagesFromPost,
  normalizePostFromBackend,
  getMainFeed,
  getFavoriteCommerces, addFavoriteCommerce, removeFavoriteCommerce,
  getSavedPosts, addSavedPost, removeSavedPost,
  generateUsername, capitalizeFirstLetter, validateEmail, validatePasswordStrength,
};