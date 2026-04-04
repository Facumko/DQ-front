/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import {
  loginUser, registerUser, logoutUser,
  clearTokens, getStoredTokens,
  getFavoriteCommerces, addFavoriteCommerce, removeFavoriteCommerce,
  getSavedPosts, addSavedPost, removeSavedPost,
} from "../Api/Api";

export const UserContext = createContext();

const MAX_LOGIN_ATTEMPTS  = 3;
const LOCKOUT_DURATION    = 30000;
const ERROR_DISPLAY_DURATION = 5000;

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.3:8080";

// ── Helpers localStorage ──────────────────────────────────────────────────
const safeGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const safeSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* ignore localStorage write failures */ }
};

export function UserProvider({ children }) {

  // ── Usuario ───────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => safeGet("user", null));

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const [loginAttempts, setLoginAttempts] = useState(
    () => safeGet("loginAttempts", { count: 0, lockedUntil: null })
  );

  // ── Negocios del usuario ──────────────────────────────────────────────
  const [businesses,  setBusinesses]  = useState([]);
  const hasBusiness = businesses.length > 0;

  // ── Favoritos: objetos completos + Set de IDs para lookup O(1) ────────
  const [favoriteCommerces,    setFavoriteCommerces]    = useState(
    () => safeGet("favoriteCommerces", [])
  );
  const [favoriteCommerceIds,  setFavoriteCommerceIds]  = useState(
    () => new Set(safeGet("favoriteCommerceIds", []))
  );

  // ── Posts guardados: objetos completos + Set de IDs ───────────────────
  const [savedPosts,    setSavedPosts]    = useState(
    () => safeGet("savedPosts", [])
  );
  const [savedPostIds,  setSavedPostIds]  = useState(
    () => new Set(safeGet("savedPostIds", []))
  );

  // ── Auto-clear error ──────────────────────────────────────────────────
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), ERROR_DISPLAY_DURATION);
    return () => clearTimeout(t);
  }, [error]);

  // ── Verificar sesión al montar ────────────────────────────────────────
  useEffect(() => {
    const storedUser   = localStorage.getItem("user");
    const { accessToken } = getStoredTokens();
    if (storedUser && !accessToken) {
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  // ── Escuchar logout forzado (refresh token expirado) ───────────────────
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setBusinesses([]);
      setFavoriteCommerces([]); setFavoriteCommerceIds(new Set());
      setSavedPosts([]); setSavedPostIds(new Set());
      localStorage.removeItem("user");
      localStorage.removeItem("favoriteCommerces");
      localStorage.removeItem("favoriteCommerceIds");
      localStorage.removeItem("savedPosts");
      localStorage.removeItem("savedPostIds");
      clearTokens();
    };

    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // ── Cargar negocios del usuario ───────────────────────────────────────
  const loadBusinesses = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/comercio/traer/mis/comercios`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!res.ok) { setBusinesses([]); return; }
      const data = await res.json();
      const arr  = Array.isArray(data) ? data : data ? [data] : [];
      setBusinesses(
        arr.filter(Boolean).map((b) => ({
          id_business:  b.idCommerce,
          name:         b.name,
          profileImage: b.profileImage?.url || null,
        }))
      );
    } catch { setBusinesses([]); }
  }, []);

  // ── Cargar favoritos y posts guardados ────────────────────────────────
  const loadFavorites = useCallback(async () => {
    const { accessToken } = getStoredTokens();
    // Si no hay token, silenciosamente ignorar
    if (!accessToken) {
      if (isDevelopment) console.warn("⚠️ loadFavorites: No hay token disponible");
      return;
    }
    try {
      if (isDevelopment) console.log("📦 Cargando favoritos y posts guardados...");
      const [commerces, posts] = await Promise.all([
        getFavoriteCommerces(),
        getSavedPosts(),
      ]);

      setFavoriteCommerces(commerces);
      setFavoriteCommerceIds(new Set(commerces.map((c) => c.idCommerce ?? c.id)));
      safeSet("favoriteCommerces",   commerces);
      safeSet("favoriteCommerceIds", commerces.map((c) => c.idCommerce ?? c.id));

      setSavedPosts(posts);
      setSavedPostIds(new Set(posts.map((p) => p.idPost ?? p.id)));
      safeSet("savedPosts",   posts);
      safeSet("savedPostIds", posts.map((p) => p.idPost ?? p.id));
      
      if (isDevelopment) console.log("✅ Favoritos cargados correctamente");
    } catch (err) {
      // Manejar errores 401 específicamente
      if (err.status === 401 || err.message?.includes('401')) {
        if (isDevelopment) console.warn("⚠️ Error 401: Token expirado o inválido. Se requiere login nuevamente.", err.message);
        // No reseteamos la sesión aquí - dejar que el usuario intente con un nuevo login
      } else if (isDevelopment) {
        console.warn("Error cargando favoritos:", err.message);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id_user) {
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        loadBusinesses();
        loadFavorites();
      } else {
        if (isDevelopment) console.log("⚠️ Usuario detectado pero sin token de acceso");
      }
    }
  }, [user?.id_user, loadBusinesses, loadFavorites]);

  // Cargar favoritos al restaurar sesión (si hay token)
  useEffect(() => {
    const { accessToken } = getStoredTokens();
    if (accessToken && user?.id_user) {
      loadFavorites();
    }
  }, [loadFavorites, user?.id_user]);

  // ── Toggle favorito comercio ──────────────────────────────────────────
  const toggleFavoriteCommerce = useCallback(async (commerce) => {
    if (!user?.id_user) return { error: "Debés iniciar sesión" };

    const id        = commerce.idCommerce ?? commerce.id_business ?? commerce.id;
    const isFav     = favoriteCommerceIds.has(id);

    // Optimistic update
    if (isFav) {
      const newIds      = new Set(favoriteCommerceIds); newIds.delete(id);
      const newCommerces = favoriteCommerces.filter((c) => (c.idCommerce ?? c.id) !== id);
      setFavoriteCommerceIds(newIds);
      setFavoriteCommerces(newCommerces);
      safeSet("favoriteCommerceIds", [...newIds]);
      safeSet("favoriteCommerces",   newCommerces);
      try {
        await removeFavoriteCommerce(id);
        return { removed: true };
      } catch {
        // Revertir si falla
        const revertIds = new Set(favoriteCommerceIds); revertIds.add(id);
        setFavoriteCommerceIds(revertIds);
        setFavoriteCommerces(favoriteCommerces);
        safeSet("favoriteCommerceIds", [...revertIds]);
        safeSet("favoriteCommerces",   favoriteCommerces);
        return { error: "Error al eliminar favorito" };
      }
    } else {
      const newIds      = new Set(favoriteCommerceIds); newIds.add(id);
      const newCommerces = [...favoriteCommerces, commerce];
      setFavoriteCommerceIds(newIds);
      setFavoriteCommerces(newCommerces);
      safeSet("favoriteCommerceIds", [...newIds]);
      safeSet("favoriteCommerces",   newCommerces);
      try {
        await addFavoriteCommerce(id);
        return { added: true };
      } catch {
        const revertIds = new Set(favoriteCommerceIds); revertIds.delete(id);
        setFavoriteCommerceIds(revertIds);
        setFavoriteCommerces(favoriteCommerces);
        safeSet("favoriteCommerceIds", [...revertIds]);
        safeSet("favoriteCommerces",   favoriteCommerces);
        return { error: "Error al agregar favorito" };
      }
    }
  }, [user, favoriteCommerceIds, favoriteCommerces]);

  // ── Toggle post guardado ──────────────────────────────────────────────
  const toggleSavedPost = useCallback(async (post) => {
    if (!user?.id_user) return { error: "Debés iniciar sesión" };

    const id      = post.idPost ?? post.id;
    const isSaved = savedPostIds.has(id);

    // Optimistic update
    if (isSaved) {
      const newIds   = new Set(savedPostIds); newIds.delete(id);
      const newPosts = savedPosts.filter((p) => (p.idPost ?? p.id) !== id);
      setSavedPostIds(newIds);
      setSavedPosts(newPosts);
      safeSet("savedPostIds", [...newIds]);
      safeSet("savedPosts",   newPosts);
      try {
        await removeSavedPost(id);
        return { removed: true };
      } catch {
        const revertIds = new Set(savedPostIds); revertIds.add(id);
        setSavedPostIds(revertIds);
        setSavedPosts(savedPosts);
        safeSet("savedPostIds", [...revertIds]);
        safeSet("savedPosts",   savedPosts);
        return { error: "Error al eliminar post guardado" };
      }
    } else {
      const newIds   = new Set(savedPostIds); newIds.add(id);
      const newPosts = [...savedPosts, post];
      setSavedPostIds(newIds);
      setSavedPosts(newPosts);
      safeSet("savedPostIds", [...newIds]);
      safeSet("savedPosts",   newPosts);
      try {
        await addSavedPost(id);
        return { added: true };
      } catch {
        const revertIds = new Set(savedPostIds); revertIds.delete(id);
        setSavedPostIds(revertIds);
        setSavedPosts(savedPosts);
        safeSet("savedPostIds", [...revertIds]);
        safeSet("savedPosts",   savedPosts);
        return { error: "Error al guardar post" };
      }
    }
  }, [user, savedPostIds, savedPosts]);

  // ── Auth ──────────────────────────────────────────────────────────────
  const isLocked = useCallback(() => {
    if (!loginAttempts.lockedUntil) return false;
    const now = Date.now();
    if (now < loginAttempts.lockedUntil) {
      return { locked: true, remainingSeconds: Math.ceil((loginAttempts.lockedUntil - now) / 1000) };
    }
    const reset = { count: 0, lockedUntil: null };
    setLoginAttempts(reset);
    safeSet("loginAttempts", reset);
    return false;
  }, [loginAttempts]);

  const incrementFailedAttempts = useCallback(() => {
    const newCount = loginAttempts.count + 1;
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      const next = { count: newCount, lockedUntil };
      setLoginAttempts(next); safeSet("loginAttempts", next);
      return { blocked: true, message: "Demasiados intentos fallidos. Intentá de nuevo en 30 segundos." };
    }
    const next = { count: newCount, lockedUntil: null };
    setLoginAttempts(next); safeSet("loginAttempts", next);
    return { blocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - newCount };
  }, [loginAttempts]);

  const resetFailedAttempts = useCallback(() => {
    const reset = { count: 0, lockedUntil: null };
    setLoginAttempts(reset); safeSet("loginAttempts", reset);
  }, []);

  const normalizeUser = (response) => ({
    id_user:        response.idUser        || response.id_user        || response.user?.idUser,
    username:       response.username      || response.user?.username,
    name:           response.name          || response.user?.name,
    lastname:       response.lastname      || response.user?.lastname,
    email:          response.email         || response.user?.email,
    recovery_email: response.recoveryEmail || response.recovery_email || response.user?.recoveryEmail,
    phone:          response.phone         || response.user?.phone,
    lastLogin:      new Date().toISOString(),
  });

  const login = async (email, password) => {
    setLoading(true); setError(null);
    const lockStatus = isLocked();
    if (lockStatus?.locked) {
      setLoading(false);
      const msg = `Demasiados intentos. Esperá ${lockStatus.remainingSeconds} segundos.`;
      setError(msg);
      return { success: false, error: msg };
    }
    try {
      const response = await loginUser(email, password);
      const userData = normalizeUser(response);
      if (!userData.id_user) throw new Error("No se recibió el ID del usuario del servidor");
      resetFailedAttempts();
      setUser(userData);
      safeSet("user", userData);
      // Cargar favoritos y negocios en paralelo
      await Promise.all([
        loadFavorites(),
        loadBusinesses(),
      ]);
      return { success: true, data: userData };
    } catch (err) {
      let errorMessage = err.message || "Error al iniciar sesión";
      let authErrorType = err.authErrorType || 'GENERIC';

      // Manejar según el tipo de error
      if (authErrorType === 'WRONG_PASSWORD') {
        errorMessage = 'La contraseña es incorrecta.';
        const attemptResult = incrementFailedAttempts();
        const finalMsg = attemptResult.blocked
          ? attemptResult.message
          : attemptResult.remainingAttempts === 1
          ? `${errorMessage} Te queda 1 intento antes del bloqueo temporal.`
          : errorMessage;
        setError(finalMsg);
        return { success: false, error: finalMsg, authErrorType };
      } else if (authErrorType === 'USER_NOT_FOUND') {
        errorMessage = 'No encontramos una cuenta con ese email.';
        // NO incrementar intentos
        setError(errorMessage);
        return { success: false, error: errorMessage, authErrorType };
      } else if (authErrorType === 'ACCOUNT_BLOCKED') {
        errorMessage = 'Tu cuenta fue suspendida. Contactanos para más información.';
        // NO incrementar intentos
        setError(errorMessage);
        return { success: false, error: errorMessage, authErrorType };
      } else if (authErrorType === 'UNVERIFIED') {
        errorMessage = 'Verificá tu email antes de iniciar sesión.';
        // NO incrementar intentos
        setError(errorMessage);
        return { success: false, error: errorMessage, authErrorType };
      } else {
        // GENERIC or others
        errorMessage = 'Email o contraseña incorrectos.';
        const attemptResult = incrementFailedAttempts();
        const finalMsg = attemptResult.blocked
          ? attemptResult.message
          : attemptResult.remainingAttempts === 1
          ? `${errorMessage} Te queda 1 intento antes del bloqueo temporal.`
          : errorMessage;
        setError(finalMsg);
        return { success: false, error: finalMsg, authErrorType };
      }
    } finally { setLoading(false); }
  };

  const register = async (userData) => {
    setLoading(true); setError(null);
    try {
      const response = await registerUser(userData);
      const newUser  = normalizeUser(response);
      if (!newUser.id_user) throw new Error("No se recibió el ID del usuario del servidor");
      setUser(newUser);
      safeSet("user", newUser);
      return { success: true, data: newUser };
    } catch (err) {
      const msg = err.message || "Error al registrar usuario";
      setError(msg);
      return { success: false, error: msg };
    } finally { setLoading(false); }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Error al cerrar sesión en backend:", err);
    } finally {
      setUser(null); setError(null);
      setBusinesses([]);
      setFavoriteCommerces([]); setFavoriteCommerceIds(new Set());
      setSavedPosts([]);        setSavedPostIds(new Set());
      localStorage.removeItem("user");
      localStorage.removeItem("favoriteCommerces");
      localStorage.removeItem("favoriteCommerceIds");
      localStorage.removeItem("savedPosts");
      localStorage.removeItem("savedPostIds");
      clearTokens();
      setLoading(false);
    }
  };

  const updateUserContext = useCallback((updatedData) => {
    const newUser = {
      ...user,
      id_user:        updatedData.idUser        || updatedData.id_user        || user?.id_user,
      username:       updatedData.username,
      name:           updatedData.name,
      lastname:       updatedData.lastname,
      email:          updatedData.email,
      recovery_email: updatedData.recoveryEmail || updatedData.recovery_email,
      phone:          updatedData.phone,
      lastLogin:      user?.lastLogin,
    };
    setUser(newUser);
    safeSet("user", newUser);
  }, [user]);

  const clearError      = useCallback(() => setError(null), []);
  const isAuthenticated = useCallback(() => {
    const { accessToken } = getStoredTokens();
    return !!user?.id_user && !!accessToken;
  }, [user]);

  // ── isDevelopment (para los logs de favoritos) ────────────────────────
  const isDevelopment = import.meta.env.MODE === 'development';

  return (
    <UserContext.Provider value={{
      // Auth
      user, setUser, loading, error,
      login, register, logout,
      updateUserContext, clearError,
      isAuthenticated,
      isLoggedIn:     isAuthenticated(),
      loginAttempts:  loginAttempts.count,
      isLocked,
      // Negocios
      businesses, setBusinesses, hasBusiness, loadBusinesses,
      // Favoritos — comercios
      favoriteCommerces, favoriteCommerceIds, toggleFavoriteCommerce,
      // Posts guardados
      savedPosts, savedPostIds, toggleSavedPost,
      // Refrescar manualmente si hace falta
      loadFavorites,
    }}>
      {children}
    </UserContext.Provider>
  );
}