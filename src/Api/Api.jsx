import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.3:8080";
const TIMEOUT = 15000;
const MAX_RETRIES = 2;
const isDevelopment = import.meta.env.MODE === 'development';

const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/registrarse',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  GET_USER: '/usuario/traer/mis/datos',
  UPDATE_USER: '/usuario/editar',
  DELETE_USER: '/usuario/eliminar',
  GET_CATEGORIES: '/categoria/traer',
  GET_IMAGES: '/imagen/traer',
  UPLOAD_IMAGE: '/imagen/guardar',
  GET_ALL_COMMERCES: '/comercio/traer',
  GET_MY_BUSINESSES:`/comercio/traer/mis/comercios`,
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
  GET_RECENT_COMMERCES: '/comercio/recientes',
  MAIN_FEED: '/main/feed',
  FOR_YOU_FEED: '/foryou/feed',
  // Favoritos - ACTUALIZADOS
  // Eventos
  CREATE_EVENT: '/evento/guardar',
  GET_ALL_EVENTS: '/evento/traer',
  GET_EVENT_BY_ID: (id) => `/evento/traer/${id}`,
  UPDATE_EVENT: (id) => `/evento/editar/${id}`,
  DELETE_EVENT: (id) => `/evento/eliminar/${id}`,
  ADD_IMAGES_TO_EVENT: (id) => `/evento/agregar/imagenes/${id}`,
  DELETE_IMAGES_FROM_EVENT: (id) => `/evento/eliminar/imagenes/${id}`,
  FAV_COMMERCE_ADD:    (idCommerce) => `/usuario/agregar/comercio/fav/${idCommerce}`,
  FAV_COMMERCE_REMOVE: (idCommerce) => `/usuario/eliminar/comercio/fav/${idCommerce}`,
  FAV_COMMERCES_GET:   '/usuario/traer/mis/comercios/fav',
  SAVED_POST_ADD:      (idPost)     => `/usuario/guardar/post/${idPost}`,
  SAVED_POST_REMOVE:   (idPost)     => `/usuario/eliminar/post/guardado/${idPost}`,
  SAVED_POSTS_GET:     '/usuario/traer/mis/posts/guardados',
  REPLACE_SCHEDULES: (commerceId) => `/comercio/reemplazar/horarios/${commerceId}`, 
  ADD_CATEGORIES_TO_COMMERCE:    (commerceId) => `/comercio/agregar/categorias/${commerceId}`,
  REMOVE_CATEGORIES_FROM_COMMERCE: (commerceId) => `/comercio/eliminar/categorias/${commerceId}`,
  GET_COMMERCES_BY_CATEGORIES:   '/comercio/traer/por/categorias',
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => { if (error) { prom.reject(error); } else { prom.resolve(token); } });
  failedQueue = [];
};

export const setAuthToken = (token) => {
  if (token) { axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; }
  else { delete axios.defaults.headers.common['Authorization']; }
};

export const getStoredTokens = () => {
  try {
    return { accessToken: localStorage.getItem('accessToken'), refreshToken: localStorage.getItem('refreshToken') };
  } catch { return { accessToken: null, refreshToken: null }; }
};

export const saveTokens = (accessToken, refreshToken) => {
  try { localStorage.setItem('accessToken', accessToken); localStorage.setItem('refreshToken', refreshToken); setAuthToken(accessToken); }
  catch (error) { console.error('Error guardando tokens:', error); }
};

export const clearTokens = () => {
  try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); setAuthToken(null); }
  catch (error) { console.error('Error limpiando tokens:', error); }
};

const refreshAccessToken = async () => {
  const { refreshToken } = getStoredTokens();
  if (isDevelopment) {
    console.log('🔄 ========== INICIO REFRESH TOKEN ==========');
    console.log('🔍 1. refreshToken:', refreshToken ? '✅ Existe' : '❌ NULL');
  }
  if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null' || refreshToken.trim() === '') {
    clearTokens(); throw new Error('No hay refresh token disponible');
  }
  const payload = { refreshToken };
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.REFRESH_TOKEN}`, payload, {
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, timeout: 10000,
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    if (!accessToken) throw new Error('Backend no devolvió accessToken');
    saveTokens(accessToken, newRefreshToken || refreshToken);
    if (isDevelopment) {
      console.log('✅ ========== FIN REFRESH TOKEN EXITOSO ==========');
    }
    return accessToken;
  } catch (error) {
    if (isDevelopment) {
      console.error('❌ Error en refresh token:', error);
    }
    clearTokens(); throw error;
  }
};

axios.interceptors.request.use((config) => {
  const publicEndpoints = [
    ENDPOINTS.LOGIN,
    ENDPOINTS.REGISTER,
    ENDPOINTS.REFRESH_TOKEN,
    '/oauth2',
    '/login/oauth2',
  ];
  const isPublic = publicEndpoints.some(ep => config.url.includes(ep));
  if (!isPublic) {
    const { accessToken } = getStoredTokens();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

axios.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && !originalRequest._retry) {
    if (originalRequest.url.includes(ENDPOINTS.REFRESH_TOKEN)) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); })
        .then(token => { originalRequest.headers.Authorization = `Bearer ${token}`; return axios(originalRequest); })
        .catch(err => Promise.reject(err));
    }
    originalRequest._retry = true; isRefreshing = true;
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
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally { isRefreshing = false; }
  }
  return Promise.reject(error);
});

axios.defaults.timeout = TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.withCredentials = false;

const { accessToken: _initToken } = getStoredTokens();
if (_initToken) setAuthToken(_initToken);

export const generateUsername = (email) => { const b = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g,''); return `${b}${Math.random().toString(36).substring(2,6)}`; };
export const capitalizeFirstLetter = (str) => { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); };
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePasswordStrength = (password) => {
  if (!password) return { strength: 'none', message: '' };
  const score = [password.length>=8,/[A-Z]/.test(password),/[a-z]/.test(password),/[0-9]/.test(password),/[!@#$%^&*(),.?":{}|<>]/.test(password)].filter(Boolean).length;
  if (score<=2) return { strength:'weak', message:'Contraseña débil', color:'#ff4444' };
  if (score<=3) return { strength:'medium', message:'Contraseña media', color:'#ffaa00' };
  return { strength:'strong', message:'Contraseña fuerte', color:'#00cc66' };
};

// Mapa de keys del frontend a DayOfWeek de Java
const DAY_KEY_TO_JAVA = {
  Lun: "MONDAY",
  Mar: "TUESDAY",
  Mie: "WEDNESDAY",
  Jue: "THURSDAY",
  Vie: "FRIDAY",
  Sab: "SATURDAY",
  Dom: "SUNDAY",
};

// Mapa inverso: DayOfWeek Java → key del frontend
const JAVA_DAY_TO_KEY = {
  MONDAY:    "Lun",
  TUESDAY:   "Mar",
  WEDNESDAY: "Mie",
  THURSDAY:  "Jue",
  FRIDAY:    "Vie",
  SATURDAY:  "Sab",
  SUNDAY:    "Dom",
};

/**
 * Convierte el schedule del frontend (objeto por día) 
 * al array de ScheduleDto que espera el backend.
 * Los días con cerrado: true se omiten del array.
 */
export const scheduleToBackend = (schedule) => {
  const result = [];
  for (const [key, val] of Object.entries(schedule)) {
    if (val.cerrado) continue; // días cerrados no se envían
    const dto = {
      day: DAY_KEY_TO_JAVA[key],
      isContinuous: val.deCorrido || false,
    };
    if (val.deCorrido) {
      // Turno corrido: open/close están en val.open y val.close directamente
      dto.morningOpening   = val.open   || "08:00";
      dto.morningClosing   = val.close  || "20:00";
      dto.afternoonOpening = null;
      dto.afternoonClosing = null;
    } else {
      dto.morningOpening   = val.manana?.open  || "08:00";
      dto.morningClosing   = val.manana?.close || "12:00";
      dto.afternoonOpening = val.tarde?.open   || "16:00";
      dto.afternoonClosing = val.tarde?.close  || "21:00";
    }
    result.push(dto);
  }
  return result;
};

/**
 * Convierte el array de ScheduleDto del backend
 * al objeto por día que usa el frontend.
 * Los días ausentes en el array se marcan como cerrado: true.
 */
export const scheduleFromBackend = (scheduleDtos, defaultSchedule) => {
  // Partir del defaultSchedule con todos los días cerrados
  const result = {};
  const ALL_KEYS = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
  
  // Inicializar todos los días como cerrados
  ALL_KEYS.forEach(key => {
    result[key] = {
      cerrado:    true,
      deCorrido:  false,
      manana:     { open: "08:00", close: "12:00" },
      tarde:      { open: "16:00", close: "21:00" },
    };
  });

  // Sobreescribir con los datos del backend
  if (Array.isArray(scheduleDtos)) {
    scheduleDtos.forEach(dto => {
      const key = JAVA_DAY_TO_KEY[dto.day];
      if (!key) return;
      result[key] = {
        cerrado:   false,
        deCorrido: dto.isContinuous || false,
        manana: {
          open:  dto.morningOpening   || "08:00",
          close: dto.morningClosing   || "12:00",
        },
        tarde: {
          open:  dto.afternoonOpening || "16:00",
          close: dto.afternoonClosing || "21:00",
        },
        // Para turno corrido, guardamos también open/close directo
        ...(dto.isContinuous && {
          open:  dto.morningOpening  || "08:00",
          close: dto.morningClosing  || "20:00",
        }),
      };
    });
  }

  return result;
};

/**
 * Reemplaza todos los horarios de un comercio.
 * Endpoint: PUT /comercio/reemplazar/horarios/{idCommerce}
 * Body: List<ScheduleDto>
 */
export const replaceCommerceSchedules = async (commerceId, schedule) => {
  validateParams({ commerceId, schedule }, ['commerceId', 'schedule']);
  const dto = scheduleToBackend(schedule);
  if (isDevelopment) {
    console.log('📅 Enviando horarios al backend:', JSON.stringify(dto, null, 2));
  }
  return apiRequest('PUT', ENDPOINTS.REPLACE_SCHEDULES(commerceId), dto);
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shouldRetry = (error) => { if (error.response?.status===401) return false; if (!error.response) return true; if (error.code==='ECONNABORTED') return true; if (error.response.status>=500) return true; return false; };
const validateApiResponse = (response, endpoint) => {
  if (typeof response==='string' && response.includes('<!DOCTYPE html>')) throw new Error(`El servidor respondió con HTML. Endpoint: ${endpoint}`);
  if (typeof response==='string' && response.includes('ngrok')) throw new Error(`Ngrok bloqueando. Endpoint: ${endpoint}`);
  return true;
};
const handleApiError = (error, endpoint) => {
  if (isDevelopment) console.error(`❌ Error en ${endpoint}:`, error);
  if (!error.response) { if (error.code==='ECONNABORTED') return new Error('⏱️ Timeout.'); return new Error(`🔌 No se pudo conectar al servidor en ${API_URL}`); }
  const { status, data } = error.response;
  const serverMessage = (data?.message || data?.error || data?.mensaje || '').toLowerCase();
  let errorMsg = '';
  let authErrorType = null;

  if (endpoint.includes(ENDPOINTS.LOGIN)) {
    if (status === 401) {
      if (serverMessage.includes('password') || serverMessage.includes('contraseña')) {
        errorMsg = 'La contraseña es incorrecta.';
        authErrorType = 'WRONG_PASSWORD';
      } else if (serverMessage.includes('email') || serverMessage.includes('user') || serverMessage.includes('cuenta')) {
        errorMsg = 'No encontramos una cuenta con ese email.';
        authErrorType = 'USER_NOT_FOUND';
      } else {
        errorMsg = 'Email o contraseña incorrectos.';
        authErrorType = 'GENERIC';
      }
    } else if (status === 403) {
      if (serverMessage.includes('block') || serverMessage.includes('suspend') || serverMessage.includes('bloquead')) {
        errorMsg = 'Tu cuenta fue suspendida. Contactanos para más información.';
        authErrorType = 'ACCOUNT_BLOCKED';
      } else if (serverMessage.includes('verif') || serverMessage.includes('verificar')) {
        errorMsg = 'Verificá tu email antes de iniciar sesión.';
        authErrorType = 'UNVERIFIED';
      } else {
        errorMsg = 'Sin permisos para iniciar sesión.';
        authErrorType = 'GENERIC';
      }
    } else if (status === 429) {
      errorMsg = 'Demasiados intentos. Esperá unos minutos antes de volver a intentar.';
      authErrorType = 'RATE_LIMITED';
    } else {
      errorMsg = 'Error al iniciar sesión.';
      authErrorType = 'GENERIC';
    }
  } else {
    const msgs = {
      400: 'Datos inválidos.',
      401: 'Sesión expirada. Por favor iniciá sesión nuevamente.',
      403: 'Sin permisos.',
      404: 'No encontrado.',
      409: 'Ya existe un registro con estos datos.',
      422: 'Error de validación.',
      500: 'Error interno del servidor.',
      502: 'Servidor no disponible.',
      503: 'Servicio no disponible.',
    };
    errorMsg = serverMessage || msgs[status] || `Error ${status}`;
  }

  const err = new Error(errorMsg);
  err.status = status;
  err.response = error.response;
  if (authErrorType) err.authErrorType = authErrorType;
  return err;
};
const validateParams = (params, names) => { for (const n of names) { if (params[n]===null||params[n]===undefined||params[n]==='') throw new Error(`Parámetro requerido faltante: ${n}`); } };

const apiRequest = async (method, endpoint, data=null, retries=MAX_RETRIES) => {
  if (isDevelopment) {
    console.log(`🌐 ${method} ${endpoint}`);
    if (data) console.log('📤 Request data:', JSON.stringify(data, null, 2));
  }
  const { accessToken } = getStoredTokens();
  const config = {
    method, url:`${API_URL}${endpoint}`, timeout:TIMEOUT,
    headers:{ 'Content-Type':'application/json','Accept':'application/json','ngrok-skip-browser-warning':'true',...(accessToken?{'Authorization':`Bearer ${accessToken}`}:{}) },
    withCredentials:false,
  };
  if (data && ['POST','PUT','PATCH'].includes(method)) config.data = data;
  try {
    const response = await axios(config);
    validateApiResponse(response.data, endpoint);
    if (isDevelopment) console.log(`✅ ${method} ${endpoint} - Success`, response.data);
    return response.data;
  } catch (error) {
    if (retries>0 && shouldRetry(error)) { await sleep(1000*(MAX_RETRIES-retries+1)); return apiRequest(method,endpoint,data,retries-1); }
    throw handleApiError(error, endpoint);
  }
};

// ============================================
// AUTH
// ============================================
// Convierte date "2026-04-10" + time "20:00" → "2026-04-10T20:00:00"
export const toLocalDateTime = (date, time) => {
  if (!date) throw new Error('La fecha es obligatoria');
  const t = time || '00:00';
  return `${date}T${t}:00`;
};
export const loginUser = async (email, password) => {
  validateParams({ email, password }, ['email', 'password']);
  if (!validateEmail(email)) throw new Error('Por favor ingresa un email válido');

  // Debug: mostrar exactamente qué se envía
  const loginPayload = { email, password };
  if (isDevelopment) {
    console.log('🔐 Login attempt:', {
      email: email ? '***@***' : 'EMPTY',
      password: password ? '***' : 'EMPTY',
      payload: loginPayload
    });
  }

  try {
    const response = await apiRequest('POST', ENDPOINTS.LOGIN, loginPayload);
    if (!response || !response.idUser) throw new Error('Respuesta inválida del servidor');
    if (response.accessToken && response.refreshToken) saveTokens(response.accessToken, response.refreshToken);
    return response;
  } catch (error) {
    if (isDevelopment) {
      console.error('❌ Login failed:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
    }
    throw error;
  }
};

// Nota: loginUserAlt se eliminó porque es una función de debug peligrosa (hace varios requests en cascada).
// Usar loginUser() para produccion.

export const registerUser = async (userData) => {
  validateParams(userData, ['email', 'password']);
  if (!validateEmail(userData.email)) throw new Error('Email inválido');
  if (userData.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
  const registrationData = {
    email: userData.email, password: userData.password,
    username: userData.username || generateUsername(userData.email),
    name: userData.name || capitalizeFirstLetter(userData.email.split('@')[0]),
    lastname: userData.lastname || '', recovery_email: userData.recovery_email || userData.email,
  };
  try {
    const response = await apiRequest('POST', ENDPOINTS.REGISTER, registrationData);
    if (!response) throw new Error('Respuesta inválida del servidor');
    if (response.accessToken && response.refreshToken) saveTokens(response.accessToken, response.refreshToken);
    return response;
  } catch (error) {
    if (error.message.includes('duplicado') || error.message.includes('409')) {
      registrationData.username = generateUsername(userData.email);
      const retry = await apiRequest('POST', ENDPOINTS.REGISTER, registrationData);
      if (!retry) throw new Error('Respuesta inválida del servidor');
      if (retry.accessToken && retry.refreshToken) saveTokens(retry.accessToken, retry.refreshToken);
      return retry;
    }
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const { refreshToken } = getStoredTokens();
    const r = await apiRequest('POST', ENDPOINTS.LOGOUT, { refreshToken });
    clearTokens();
    return r;
  } catch {
    clearTokens();
    return { success: true };
  }
};

// ============================================
// USUARIO - ACTUALIZADOS
// ============================================

export const getMyUser  = async () => { 
  return apiRequest('GET', ENDPOINTS.GET_USER); 
};

export const updateUser = async (userData) => { 
  validateParams({userData},['userData']); 
  await apiRequest('PUT', ENDPOINTS.UPDATE_USER, userData);
  return apiRequest('GET', ENDPOINTS.GET_USER);
};

export const deleteUser = async () => {
  return apiRequest('DELETE', ENDPOINTS.DELETE_USER);
};

// ============================================
// CATEGORÍAS
// ============================================

export const getCategories = async () => apiRequest('GET', ENDPOINTS.GET_CATEGORIES);

// ============================================
// IMÁGENES (antiguas)
// ============================================

export const getImages = async () => apiRequest('GET', ENDPOINTS.GET_IMAGES);
export const uploadImage = async (imageData) => { validateParams({imageData},['imageData']); return apiRequest('POST', ENDPOINTS.UPLOAD_IMAGE, imageData); };

// ============================================
// NEGOCIOS
// ============================================

// ── Normaliza string de Nominatim → ≤100 chars ──────────────────────────────
const normalizeAddressString = (address) => {
  if (!address) return null;
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  const meaningful = parts.slice(0, 3).join(", ");
  return meaningful.substring(0, 100);
};

// ── Construye AddressDto ─────────────────────────────────────────────────────
const buildAddressDto = (location) => {
  if (!location?.lat || !location?.lng) return null;
  const addressStr = normalizeAddressString(location.address);
  return {
    idAddress: location.idAddress ?? null,
    address:   addressStr,
    street:    addressStr,
    district:  null,
    location:  null,
    lat:       location.lat,
    lng:       location.lng,
  };
};


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

export const getMyBusiness = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.GET_MY_BUSINESSES);
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
      schedules:    business.schedules || [],
      address:      business.address   || null, // ← faltaba
      categories: Array.isArray(business.categories) ? business.categories : [],  
      
    };
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('no encontrado')) {
      if (isDevelopment) console.log("ℹ️ Sin negocio (404)");
      return null;
    }
    throw error;
  }
};  

// Mantener alias para compatibilidad de código legado
export const getBusinessByUserId = getMyBusiness;


export const getBusinessById = async (businessId) => {
  validateParams({ businessId }, ['businessId']);
  const response = await apiRequest('GET', ENDPOINTS.GET_BUSINESS(businessId));
  const business = Array.isArray(response) ? response[0] : response;
  if (!business) throw new Error('Negocio no encontrado');
  if (isDevelopment) console.log("🖼️ Datos del negocio completo:", business);
  return {
    id_business:  business.idCommerce,
    id_user:      business.idOwner,
    name:         business.name         || '',
    description:  business.description  || '',
    email:        business.email        || '',
    phone:        business.phone        || '',
    link:         business.link         || '',
    branchOf:     business.branchOf     || null,
    profileImage: business.profileImage?.url || null,
    coverImage:   business.coverImage?.url   || null,
    schedules:    business.schedules    || [],
    address:      business.address      || null, // ← faltaba
    categories: Array.isArray(business.categories) ? business.categories : [],
  };
};

export const createBusiness = async (businessData) => {
  validateParams({ businessData }, ['businessData']);
  if (!businessData.name?.trim()) throw new Error('El nombre es obligatorio');
  if (!businessData.description?.trim()) throw new Error('La descripción es obligatoria');

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
    schedules:   businessData.schedules ? scheduleToBackend(businessData.schedules) : [],
    address:     buildAddressDto(businessData.location),
  };

  if (isDevelopment) {
    console.log("📤 Creando negocio:", dataToSend);
    console.log("📍 AddressDto enviado:", dataToSend.address);
  }

  try {
    const response = await apiRequest('POST', ENDPOINTS.CREATE_BUSINESS, dataToSend);
    if (isDevelopment) console.log("📦 Respuesta:", response);
    return {
      id_business:  response.idCommerce,
      id_user:      response.idOwner,
      name:         response.name,
      description:  response.description,
      email:        response.email,
      phone:        response.phone,
      website:      response.website,
      profileImage: response.profileImage?.url || null,
      coverImage:   response.coverImage?.url   || null,
    };
  } catch (error) {
    console.error("❌ Error en createBusiness:", error);
    throw error;
  }
};

export const updateBusiness = async (businessId, businessData) => {
  validateParams({ businessId, businessData }, ['businessId', 'businessData']);
  if (businessData.name !== undefined && businessData.name.trim() === '')
    throw new Error('El nombre no puede estar vacío');
  if (businessData.description !== undefined && businessData.description.trim() === '')
    throw new Error('La descripción no puede estar vacía');

  const dataToSend = {};
  if (businessData.name        !== undefined) dataToSend.name        = businessData.name.trim();
  if (businessData.description !== undefined) dataToSend.description = businessData.description.trim();
  if (businessData.email       !== undefined) dataToSend.email       = businessData.email.trim();
  if (businessData.phone       !== undefined) dataToSend.phone       = businessData.phone.replace(/\D/g, '');
  if (businessData.link        !== undefined) dataToSend.website     = businessData.link.trim();
  if (businessData.branchOf    !== undefined) dataToSend.branchOf    = businessData.branchOf;
  if (businessData.location    !== undefined) dataToSend.address     = buildAddressDto(businessData.location);

  if (isDevelopment) {
    console.log("📤 Actualizando negocio:", businessId, dataToSend);
    console.log("📍 AddressDto enviado:", dataToSend.address);
  }

  const response = await apiRequest('PUT', ENDPOINTS.UPDATE_BUSINESS(businessId), dataToSend);
  if (isDevelopment) console.log("📦 Respuesta update:", response);

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
  };
};
// ============================================
// IMÁGENES DE COMERCIO
// ============================================

export const uploadProfileImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  if (!(imageFile instanceof File)) throw new Error('Archivo inválido');
  if (imageFile.size > 5*1024*1024) throw new Error('La imagen no puede superar los 5MB');
  if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(imageFile.type)) throw new Error('Formato inválido. Usa JPG, PNG o WebP');
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.UPLOAD_PROFILE_IMAGE(businessId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:30000 });
    await sleep(1000);
    const updated = await getBusinessById(businessId);
    return { success:true, profileImage:updated.profileImage, cloudinaryData:response.data };
  } catch (error) { throw handleApiError(error, 'uploadProfileImage'); }
};

export const uploadCoverImage = async (businessId, imageFile) => {
  validateParams({ businessId, imageFile }, ['businessId', 'imageFile']);
  if (!(imageFile instanceof File)) throw new Error('Archivo inválido');
  if (imageFile.size > 5*1024*1024) throw new Error('La imagen no puede superar los 5MB');
  if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(imageFile.type)) throw new Error('Formato inválido. Usa JPG, PNG o WebP');
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.UPLOAD_COVER_IMAGE(businessId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:30000 });
    await sleep(1000);
    const updated = await getBusinessById(businessId);
    return { success:true, coverImage:updated.coverImage, cloudinaryData:response.data };
  } catch (error) { throw handleApiError(error, 'uploadCoverImage'); }
};

export const uploadGalleryImages = async (businessId, imageFiles) => {
  validateParams({ businessId, imageFiles }, ['businessId', 'imageFiles']);
  if (!Array.isArray(imageFiles) || imageFiles.length===0) throw new Error('Al menos una imagen');
  if (imageFiles.length>10) throw new Error('Máximo 10 imágenes');
  for (const f of imageFiles) { if (f.size>5*1024*1024) throw new Error(`"${f.name}" supera los 5MB`); }
  const formData = new FormData();
  imageFiles.forEach(f => formData.append('files', f));
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.UPLOAD_GALLERY_IMAGES(businessId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:60000 });
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
  } catch (error) { if (error.message.includes('404')) return []; throw error; }
};

export const createPost = async (description, idCommerce, imageFiles=[], eventData=null) => {
  validateParams({ description, idCommerce }, ['description', 'idCommerce']);
  if (!imageFiles?.length) throw new Error('Debes subir al menos una imagen');
  if (imageFiles.length>10) throw new Error('Máximo 10 imágenes');
  for (const f of imageFiles) {
    if (!(f instanceof File)) throw new Error('Archivo inválido');
    if (f.size>5*1024*1024) throw new Error(`"${f.name}" supera los 5MB`);
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) throw new Error(`Formato inválido en "${f.name}"`);
  }
  const formData = new FormData();
  if (eventData) {
    formData.append('eventData', JSON.stringify(eventData));
  }
  formData.append('description', description.trim());
  formData.append('idCommerce', idCommerce);
  imageFiles.forEach(f => formData.append('images', f));
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.POST_CREATE}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:60000 });
    return response.data;
  } catch (error) { throw handleApiError(error, 'createPost'); }
};

export const getAllPosts = async () => apiRequest('GET', ENDPOINTS.POST_GET_ALL);
export const getPostById = async (postId) => { validateParams({postId},['postId']); return apiRequest('GET', ENDPOINTS.POST_GET_BY_ID(postId)); };

export const updatePostText = async (postId, description, idCommerce) => {
  validateParams({ postId, description, idCommerce }, ['postId','description','idCommerce']);
  if (!description?.trim()) throw new Error('La descripción no puede estar vacía');
  const response = await apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), { description:description.trim(), idCommerce });
  return normalizePostFromBackend(response);
};

export const updatePost = async (postId, postData) => {
  validateParams({ postId, postData }, ['postId','postData']);
  if (!postData.description?.trim()) throw new Error('La descripción no puede estar vacía');
  return apiRequest('PUT', ENDPOINTS.POST_UPDATE(postId), { description:postData.description.trim(), idCommerce:postData.idCommerce });
};

export const deletePost = async (postId) => {
  validateParams({ postId }, ['postId']);
  try {
    const response = await axios.delete(`${API_URL}${ENDPOINTS.POST_DELETE(postId)}`, { timeout:TIMEOUT, headers:{'ngrok-skip-browser-warning':'true'} });
    return response.data;
  } catch (error) { throw handleApiError(error, 'deletePost'); }
};

export const addImagesToPost = async (postId, imageFiles) => {
  validateParams({ postId, imageFiles }, ['postId','imageFiles']);
  if (!Array.isArray(imageFiles)||imageFiles.length===0) throw new Error('Al menos una imagen');
  const formData = new FormData();
  imageFiles.forEach(f => formData.append('images', f));
  try {
    const response = await axios.post(`${API_URL}${ENDPOINTS.POST_ADD_IMAGES(postId)}`, formData, { headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}, timeout:60000 });
    return response.data;
  } catch (error) { throw handleApiError(error, 'addImagesToPost'); }
};

export const deleteImagesFromPost = async (postId, imageIds) => {
  validateParams({ postId, imageIds }, ['postId','imageIds']);
  if (!Array.isArray(imageIds)||imageIds.length===0) throw new Error('Al menos un ID de imagen');
  try {
    const queryParams = imageIds.map(id=>`imageIds=${id}`).join('&');
    const response = await axios.delete(`${API_URL}${ENDPOINTS.POST_DELETE_IMAGES(postId)}?${queryParams}`, { headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'true'}, timeout:TIMEOUT });
    return response.data;
  } catch (error) { throw handleApiError(error, 'deleteImagesFromPost'); }
};

// ============================================
// NORMALIZADORES
// ============================================

export const normalizePostFromBackend = (post) => {
  if (post.images && Array.isArray(post.images)) {
    const sorted = post.images.sort((a,b) => a.imageOrder - b.imageOrder);
    return { id:post.idPost, text:post.description, images:sorted.map(i=>i.url), imageDetails:sorted.map(i=>({id:i.idImage,url:i.url,order:i.imageOrder,publicId:i.publicId,originalFileName:i.originalFileName})), type:"post", businessName:post.nameCommerce, createdAt:post.postedAt };
  }
  return { id:post.idPost||post.id, text:post.description||post.text, images:Array.isArray(post.images)?post.images:[], imageDetails:[], type:"post", businessName:post.nameCommerce||post.businessName, createdAt:post.postedAt||post.createdAt };
};

// ============================================
// BÚSQUEDA
// ============================================

export const searchCommerces = async (searchParam, limit=10, offset=0) => {
  if (!searchParam || searchParam.trim()==='') throw new Error('Debes ingresar un término de búsqueda');
  const params = new URLSearchParams({ searchParam:searchParam.trim(), limit:limit.toString(), offset:offset.toString() });
  try {
    if (isDevelopment) console.log('🔍 Buscando comercios:', { searchParam, limit, offset });
    const response = await apiRequest('GET', `${ENDPOINTS.SEARCH_COMMERCES}?${params}`);
    if (isDevelopment) console.log('✅ Resultados:', Array.isArray(response) ? response.length : 0);
    return Array.isArray(response) ? response : [];
  } catch (error) { if (isDevelopment) console.error('❌ Error búsqueda:', error); throw error; }
};

// ============================================
// FAVORITOS Y GUARDADOS - ACTUALIZADOS
// ============================================

export const getFavoriteCommerces = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.FAV_COMMERCES_GET);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message?.includes('404')) return [];
    throw error;
  }
};

export const addFavoriteCommerce = async (idCommerce) => {
  validateParams({ idCommerce }, ['idCommerce']);
  return apiRequest('POST', ENDPOINTS.FAV_COMMERCE_ADD(idCommerce));
};

export const removeFavoriteCommerce = async (idCommerce) => {
  validateParams({ idCommerce }, ['idCommerce']);
  return apiRequest('DELETE', ENDPOINTS.FAV_COMMERCE_REMOVE(idCommerce));
};

export const getSavedPosts = async () => {
  try {
    const response = await apiRequest('GET', ENDPOINTS.SAVED_POSTS_GET);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    if (error.message?.includes('404')) return [];
    throw error;
  }
};

export const addSavedPost = async (idPost) => {
  validateParams({ idPost }, ['idPost']);
  return apiRequest('POST', ENDPOINTS.SAVED_POST_ADD(idPost));
};

export const removeSavedPost = async (idPost) => {
  validateParams({ idPost }, ['idPost']);
  return apiRequest('DELETE', ENDPOINTS.SAVED_POST_REMOVE(idPost));
};

// ============================================
// COMERCIOS RECIENTES
// ============================================

export const getRecentCommerces = async () => {
  const response = await apiRequest('GET', ENDPOINTS.GET_RECENT_COMMERCES);
  return Array.isArray(response) ? response : [];
};

// ============================================
// FEED PRINCIPAL - ACTUALIZADO
// ============================================

export const getMainFeed = async (page = 0, size = 10) => {
  const response = await apiRequest('GET', `${ENDPOINTS.MAIN_FEED}?page=${page}&size=${size}`);
  return Array.isArray(response) ? response : [];
};
// ============================================
// CATEGORIAS
// ============================================
export const addCommerceCategories = async (commerceId, categoryIds) => {
  validateParams({ commerceId, categoryIds }, ['commerceId', 'categoryIds']);
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error('Debés seleccionar al menos una categoría');
  return apiRequest('POST', ENDPOINTS.ADD_CATEGORIES_TO_COMMERCE(commerceId), categoryIds);
};

export const removeCommerceCategories = async (commerceId, categoryIds) => {
  validateParams({ commerceId, categoryIds }, ['commerceId', 'categoryIds']);
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error('Debés seleccionar al menos una categoría');
  const queryParams = categoryIds.map(id => `categoryIds=${id}`).join('&');
  try {
    const { accessToken } = getStoredTokens();
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.REMOVE_CATEGORIES_FROM_COMMERCE(commerceId)}?${queryParams}`,
      { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, timeout: TIMEOUT }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'removeCommerceCategories'); }
};

export const getCommercesByCategories = async (categoryIds) => {
  validateParams({ categoryIds }, ['categoryIds']);
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error('Seleccioná al menos una categoría');
  const queryParams = categoryIds.map(id => `categoryIds=${id}`).join('&');
  try {
    const response = await apiRequest('GET', `${ENDPOINTS.GET_COMMERCES_BY_CATEGORIES}?${queryParams}`);
    return Array.isArray(response) ? response : [];
  } catch (error) { if (isDevelopment) console.error('Error filtrando por categorías:', error); throw error; }
};

// ============================================
// EVENTOS
// ============================================

export const createEvent = async (eventData, imageFiles = []) => {
  validateParams({ eventData }, ['eventData']);
  if (!imageFiles?.length) throw new Error('Debes subir al menos una imagen');

  const formData = new FormData();
  formData.append('title',            eventData.title);
  formData.append('description',      eventData.description);
  formData.append('startDate',        eventData.startDate);   // formato ISO: "2026-04-10T20:00:00"
  formData.append('endDate',          eventData.endDate);
  formData.append('idCommerceOwner',  eventData.idCommerceOwner);
  if (eventData.address) formData.append('address', JSON.stringify(eventData.address));
  imageFiles.forEach(f => formData.append('images', f));

  try {
    const { accessToken } = getStoredTokens();
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.CREATE_EVENT}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        timeout: 60000
      }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'createEvent'); }
};

export const getAllEvents = async () => apiRequest('GET', ENDPOINTS.GET_ALL_EVENTS);

export const getEventById = async (id) => {
  validateParams({ id }, ['id']);
  return apiRequest('GET', ENDPOINTS.GET_EVENT_BY_ID(id));
};

export const updateEvent = async (id, eventDto) => {
  validateParams({ id, eventDto }, ['id', 'eventDto']);
  return apiRequest('PUT', ENDPOINTS.UPDATE_EVENT(id), eventDto);
};

export const deleteEvent = async (id) => {
  validateParams({ id }, ['id']);
  return apiRequest('DELETE', ENDPOINTS.DELETE_EVENT(id));
};

export const addImagesToEvent = async (id, imageFiles) => {
  validateParams({ id, imageFiles }, ['id', 'imageFiles']);
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) throw new Error('Al menos una imagen');
  const formData = new FormData();
  imageFiles.forEach(f => formData.append('images', f));
  try {
    const response = await axios.post(
      `${API_URL}${ENDPOINTS.ADD_IMAGES_TO_EVENT(id)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' }, timeout: 60000 }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'addImagesToEvent'); }
};

export const deleteImagesFromEvent = async (id, imageIds) => {
  validateParams({ id, imageIds }, ['id', 'imageIds']);
  if (!Array.isArray(imageIds) || imageIds.length === 0) throw new Error('Al menos un ID');
  const queryParams = imageIds.map(imgId => `eventIds=${imgId}`).join('&');
  try {
    const { accessToken } = getStoredTokens();
    const response = await axios.delete(
      `${API_URL}${ENDPOINTS.DELETE_IMAGES_FROM_EVENT(id)}?${queryParams}`,
      { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, timeout: TIMEOUT }
    );
    return response.data;
  } catch (error) { throw handleApiError(error, 'deleteImagesFromEvent'); }
};
// ============================================
// EXPORTACIÓN
// ============================================

export default {
  loginUser, registerUser, logoutUser,
  setAuthToken, getStoredTokens, saveTokens, clearTokens,
  getMyUser, updateUser, deleteUser,
  searchCommerces, getRecentCommerces,
  getCategories,
  getImages, uploadImage,
  getAllCommerces,
  getMyBusiness, getBusinessByUserId, getBusinessById, createBusiness, updateBusiness,
  uploadProfileImage, uploadCoverImage, uploadGalleryImages,
  createPost, getAllPosts, getPostById, getPostsByCommerce,
  updatePost, updatePostText, deletePost, addImagesToPost, deleteImagesFromPost,
  normalizePostFromBackend,
  getMainFeed,
  getFavoriteCommerces, addFavoriteCommerce, removeFavoriteCommerce,
  getSavedPosts, addSavedPost, removeSavedPost,
  generateUsername, capitalizeFirstLetter, validateEmail, validatePasswordStrength,
  replaceCommerceSchedules,
  scheduleToBackend,
  scheduleFromBackend, addCommerceCategories, removeCommerceCategories, getCommercesByCategories,
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, addImagesToEvent, deleteImagesFromEvent, toLocalDateTime 
};