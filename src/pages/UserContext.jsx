import { createContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser, saveTokens, clearTokens, getStoredTokens } from "../Api/Api";

export const UserContext = createContext();

const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000;
const ERROR_DISPLAY_DURATION = 5000;

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.3:8080";

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [loginAttempts, setLoginAttempts] = useState(() => {
    const stored = localStorage.getItem("loginAttempts");
    return stored ? JSON.parse(stored) : { count: 0, lockedUntil: null };
  });

  // Array de negocios del usuario
  const [businesses, setBusinesses] = useState([]);
  const hasBusiness = businesses.length > 0;

  // Cargar todos los negocios del usuario
  const loadBusinesses = useCallback(async (userId) => {
    if (!userId) {
      setBusinesses([]);
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/comercio/traer/usuario/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        setBusinesses([]);
        return;
      }
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data ? [data] : [];
      setBusinesses(
        arr.filter(Boolean).map((b) => ({
          id_business: b.idCommerce,
          name: b.name,
          profileImage: b.profileImage?.url || null,
        }))
      );
    } catch {
      setBusinesses([]);
    }
  }, []);

  useEffect(() => {
    loadBusinesses(user?.id_user);
  }, [user?.id_user, loadBusinesses]);

  // Verificar si hay tokens válidos al iniciar
  useEffect(() => {
    const { accessToken } = getStoredTokens();
    if (accessToken && user) {
      console.log("✅ Sesión JWT restaurada");
    } else if (!accessToken && user) {
      console.warn("⚠️ Usuario sin token JWT, limpiando sesión");
      setUser(null);
      localStorage.removeItem("user");
    }
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), ERROR_DISPLAY_DURATION);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const isLocked = useCallback(() => {
    if (!loginAttempts.lockedUntil) return false;
    const now = Date.now();
    if (now < loginAttempts.lockedUntil) {
      const remainingSeconds = Math.ceil((loginAttempts.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }
    setLoginAttempts({ count: 0, lockedUntil: null });
    localStorage.setItem("loginAttempts", JSON.stringify({ count: 0, lockedUntil: null }));
    return false;
  }, [loginAttempts]);

  const incrementFailedAttempts = useCallback(() => {
    const newCount = loginAttempts.count + 1;
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      const newAttempts = { count: newCount, lockedUntil };
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", JSON.stringify(newAttempts));
      return { blocked: true, message: "Demasiados intentos fallidos. Intenta nuevamente en 30 segundos." };
    }
    const newAttempts = { count: newCount, lockedUntil: null };
    setLoginAttempts(newAttempts);
    localStorage.setItem("loginAttempts", JSON.stringify(newAttempts));
    return { blocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - newCount };
  }, [loginAttempts]);

  const resetFailedAttempts = useCallback(() => {
    setLoginAttempts({ count: 0, lockedUntil: null });
    localStorage.setItem("loginAttempts", JSON.stringify({ count: 0, lockedUntil: null }));
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    const lockStatus = isLocked();
    if (lockStatus && lockStatus.locked) {
      setLoading(false);
      setError(`Demasiados intentos. Espera ${lockStatus.remainingSeconds} segundos.`);
      return { success: false, error: `Demasiados intentos. Espera ${lockStatus.remainingSeconds} segundos.` };
    }
    try {
      const response = await loginUser(email, password);
      const userData = {
        id_user: response.idUser || response.id_user || response.user?.idUser || response.user?.id_user,
        username: response.username || response.user?.username,
        name: response.name || response.user?.name,
        lastname: response.lastname || response.user?.lastname,
        email: response.email || response.user?.email,
        recovery_email: response.recoveryEmail || response.recovery_email || response.user?.recoveryEmail,
        phone: response.phone || response.user?.phone,
        lastLogin: new Date().toISOString(),
      };

      console.log("Usuario normalizado:", userData);

      if (!userData.id_user) {
        throw new Error("No se recibió el ID del usuario del servidor");
      }

      // Los tokens ya se guardaron en Api.jsx, solo resetear intentos
      resetFailedAttempts();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.message || "Error al iniciar sesión";
      const attemptResult = incrementFailedAttempts();
      let finalErrorMessage = errorMessage;
      if (attemptResult.blocked) finalErrorMessage = attemptResult.message;
      else if (attemptResult.remainingAttempts)
        finalErrorMessage = `${errorMessage}. Te quedan ${attemptResult.remainingAttempts} intentos.`;
      setError(finalErrorMessage);
      return { success: false, error: finalErrorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser(userData);
      const newUser = {
        id_user: response.idUser || response.id_user || response.user?.idUser || response.user?.id_user,
        username: response.username || response.user?.username,
        name: response.name || response.user?.name,
        lastname: response.lastname || response.user?.lastname,
        email: response.email || response.user?.email,
        recovery_email: response.recoveryEmail || response.recovery_email || response.user?.recoveryEmail,
        phone: response.phone || response.user?.phone,
        lastLogin: new Date().toISOString(),
      };

      console.log("Usuario normalizado:", newUser);

      if (!newUser.id_user) {
        throw new Error("No se recibió el ID del usuario del servidor");
      }

      // Los tokens ya se guardaron en Api.jsx
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      return { success: true, data: newUser };
    } catch (err) {
      const errorMessage = err.message || "Error al registrar usuario";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user?.id_user) {
        await logoutUser(user.id_user); // Ya limpia tokens en Api.jsx
      }
    } catch (err) {
      console.warn("Error al cerrar sesión en backend:", err);
    } finally {
      setUser(null);
      setError(null);
      setBusinesses([]); // Limpiar negocios al cerrar sesión
      localStorage.removeItem("user");
      clearTokens(); // Asegurar limpieza de tokens
      setLoading(false);
    }
  };

  const updateUserContext = useCallback(
    (updatedData) => {
      const normalizedData = {
        id_user: updatedData.idUser || updatedData.id_user || user?.id_user,
        username: updatedData.username,
        name: updatedData.name,
        lastname: updatedData.lastname,
        email: updatedData.email,
        recovery_email: updatedData.recoveryEmail || updatedData.recovery_email,
        phone: updatedData.phone,
        lastLogin: user?.lastLogin,
      };
      const newUser = { ...user, ...normalizedData };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    },
    [user]
  );

  const clearError = useCallback(() => setError(null), []);

  const isAuthenticated = useCallback(() => {
    const { accessToken } = getStoredTokens(); // Verificar token
    return user !== null && user.id_user !== undefined && !!accessToken;
  }, [user]);

  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem("user");
      const { accessToken } = getStoredTokens();

      if (storedUser && accessToken) {
        try {
          const userData = JSON.parse(storedUser);
          if (!userData.id_user) {
            localStorage.removeItem("user");
            clearTokens();
            setUser(null);
            return;
          }
          setUser(userData);
        } catch {
          localStorage.removeItem("user");
          clearTokens();
          setUser(null);
        }
      } else if (storedUser && !accessToken) {
        // Usuario sin token = sesión inválida
        console.warn("Usuario sin token JWT, limpiando");
        localStorage.removeItem("user");
        setUser(null);
      }
    };
    checkSession();
  }, []);

  const handleApiError = useCallback((error) => {
    if (error.response?.status === 401) {
      logout();
      setError("Sesión expirada. Por favor inicia sesión nuevamente.");
    } else {
      setError(error.message || "Error de conexión");
    }
  }, []);

  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUserContext,
    clearError,
    isAuthenticated,
    handleApiError,
    isLoggedIn: isAuthenticated(),
    loginAttempts: loginAttempts.count,
    isLocked: isLocked(),
    // Negocios
    businesses,
    setBusinesses,
    hasBusiness,
    loadBusinesses,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}