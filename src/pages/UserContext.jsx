import { createContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser } from "../Api/Api";

export const UserContext = createContext();

const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000; // 30 segundos
const ERROR_DISPLAY_DURATION = 5000; // 5 segundos

export function UserProvider({ children }) {
  // Estado del usuario
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Rate limiting
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const stored = localStorage.getItem("loginAttempts");
    return stored ? JSON.parse(stored) : { count: 0, lockedUntil: null };
  });

  // Auto-limpiar errores después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, ERROR_DISPLAY_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Verificar si está bloqueado por rate limiting
  const isLocked = useCallback(() => {
    if (!loginAttempts.lockedUntil) return false;
    
    const now = Date.now();
    if (now < loginAttempts.lockedUntil) {
      const remainingSeconds = Math.ceil((loginAttempts.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }
    
    // Bloqueo expirado, resetear intentos
    setLoginAttempts({ count: 0, lockedUntil: null });
    localStorage.setItem("loginAttempts", JSON.stringify({ count: 0, lockedUntil: null }));
    return false;
  }, [loginAttempts]);

  // Incrementar intentos fallidos
  const incrementFailedAttempts = useCallback(() => {
    const newCount = loginAttempts.count + 1;
    
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      const newAttempts = { count: newCount, lockedUntil };
      
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", JSON.stringify(newAttempts));
      
      return {
        blocked: true,
        message: `Demasiados intentos fallidos. Intenta nuevamente en 30 segundos.`
      };
    }
    
    const newAttempts = { count: newCount, lockedUntil: null };
    setLoginAttempts(newAttempts);
    localStorage.setItem("loginAttempts", JSON.stringify(newAttempts));
    
    return {
      blocked: false,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - newCount
    };
  }, [loginAttempts]);

  // Resetear intentos fallidos (login exitoso)
  const resetFailedAttempts = useCallback(() => {
    setLoginAttempts({ count: 0, lockedUntil: null });
    localStorage.setItem("loginAttempts", JSON.stringify({ count: 0, lockedUntil: null }));
  }, []);

  // Función de login mejorada
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    // Verificar rate limiting
    const lockStatus = isLocked();
    if (lockStatus && lockStatus.locked) {
      setLoading(false);
      setError(`Demasiados intentos. Espera ${lockStatus.remainingSeconds} segundos.`);
      return { success: false, error: `Demasiados intentos. Espera ${lockStatus.remainingSeconds} segundos.` };
    }
    
    try {
      const response = await loginUser(email, password);
      console.log("Respuesta completa del backend:", response);
      
      // Normalizar respuesta
      const userData = {
        id_user: response.idUser || response.id_user || response.user?.idUser || response.user?.id_user,
        username: response.username || response.user?.username,
        name: response.name || response.user?.name,
        lastname: response.lastname || response.user?.lastname,
        email: response.email || response.user?.email,
        recovery_email: response.recoveryEmail || response.recovery_email || response.user?.recoveryEmail,
        phone: response.phone || response.user?.phone,
        token: response.token || response.user?.token,
        lastLogin: new Date().toISOString()
      };

      console.log("Usuario normalizado:", userData);

      // Validar ID
      if (!userData.id_user) {
        throw new Error("No se recibió el ID del usuario del servidor");
      }

      // Login exitoso - resetear intentos fallidos
      resetFailedAttempts();
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return { success: true, data: userData };
      
    } catch (err) {
      const errorMessage = err.message || "Error al iniciar sesión";
      
      // Incrementar intentos fallidos
      const attemptResult = incrementFailedAttempts();
      
      let finalErrorMessage = errorMessage;
      if (attemptResult.blocked) {
        finalErrorMessage = attemptResult.message;
      } else if (attemptResult.remainingAttempts) {
        finalErrorMessage = `${errorMessage}. Te quedan ${attemptResult.remainingAttempts} intentos.`;
      }
      
      setError(finalErrorMessage);
      return { success: false, error: finalErrorMessage };
      
    } finally {
      setLoading(false);
    }
  };

  // Función de registro mejorada
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await registerUser(userData);
      console.log("Respuesta completa del registro:", response);
      
      // Normalizar respuesta
      const newUser = {
        id_user: response.idUser || response.id_user || response.user?.idUser || response.user?.id_user,
        username: response.username || response.user?.username,
        name: response.name || response.user?.name,
        lastname: response.lastname || response.user?.lastname,
        email: response.email || response.user?.email,
        recovery_email: response.recoveryEmail || response.recovery_email || response.user?.recoveryEmail,
        phone: response.phone || response.user?.phone,
        token: response.token || response.user?.token,
        lastLogin: new Date().toISOString()
      };

      console.log("Usuario normalizado:", newUser);

      // Validar ID
      if (!newUser.id_user) {
        throw new Error("No se recibió el ID del usuario del servidor");
      }

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

  // Cerrar sesión mejorado (backend + local)
  const logout = async () => {
    setLoading(true);
    
    try {
      // Intentar logout en backend
      if (user?.id_user) {
        await logoutUser(user.id_user);
      }
    } catch (err) {
      console.warn("Error al cerrar sesión en backend:", err);
      // Continuar con logout local aunque falle el backend
    } finally {
      // Limpiar estado local
      setUser(null);
      setError(null);
      localStorage.removeItem("user");
      setLoading(false);
    }
  };

  // Actualizar datos del usuario
  const updateUserContext = useCallback((updatedData) => {
    console.log("Actualizando contexto con:", updatedData);
    
    const normalizedData = {
      id_user: updatedData.idUser || updatedData.id_user || user?.id_user,
      username: updatedData.username,
      name: updatedData.name,
      lastname: updatedData.lastname,
      email: updatedData.email,
      recovery_email: updatedData.recoveryEmail || updatedData.recovery_email,
      phone: updatedData.phone,
      token: updatedData.token || user?.token,
      lastLogin: user?.lastLogin
    };

    const newUser = { ...user, ...normalizedData };
    console.log("Usuario actualizado:", newUser);
    
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  }, [user]);

  // Limpiar errores manualmente
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificar autenticación
  const isAuthenticated = useCallback(() => {
    return user !== null && user.id_user !== undefined;
  }, [user]);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Validar ID
          if (!userData.id_user) {
            console.warn("Usuario sin ID válido, limpiando sesión");
            localStorage.removeItem("user");
            setUser(null);
            return;
          }
          
          setUser(userData);
        } catch (error) {
          console.warn("Error al verificar sesión:", error);
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    };
    
    checkSession();
  }, []);

  // Manejar errores de API (401 = sesión expirada)
  const handleApiError = useCallback((error) => {
    if (error.response?.status === 401) {
      logout();
      setError("Sesión expirada. Por favor inicia sesión nuevamente.");
    } else {
      setError(error.message || "Error de conexión");
    }
  }, []);

  // Valores del contexto
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
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}