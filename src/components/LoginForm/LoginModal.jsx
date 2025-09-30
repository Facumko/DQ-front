import { useState, useContext, useEffect } from "react";
import { UserContext } from "../../pages/UserContext";
import "./LoginModal.css";
import { FaEye, FaEyeSlash, FaMapMarkerAlt, FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

export default function LoginModal({ onClose }) {
  const { login, register, loading, error, clearError } = useContext(UserContext);
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Restablecer contraseña
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Limpiar errores al cambiar inputs
  useEffect(() => {
    if (localError && (email || password || registerPassword)) {
      setLocalError('');
    }
  }, [email, password, registerPassword, localError]);

  // Limpiar errores del contexto al cerrar modal
  useEffect(() => {
    return () => {
      if (clearError) clearError();
    };
  }, [clearError]);

  const checkEmail = (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email.trim()) {
      setLocalError('Por favor ingresa tu correo electrónico');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    // Para pruebas: cualquier email va al login
    // En producción podrías verificar en el backend si el email existe
    setStep("login");
  };

  // --- LOGIN MEJORADO ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (clearError) clearError();
    
    // Validaciones básicas
    if (!email.trim() || !password.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    console.log("Intentando login con:", { email, password: "***" });

    // Usar la función login del contexto
    const result = await login(email, password);
    
    if (result.success) {
      console.log("Login exitoso, cerrando modal");
      onClose(); // Cierra modal solo si es exitoso
    } else {
      console.log("Error en login:", result.error);
      setLocalError(result.error);
    }
  };

  // --- REGISTRO MEJORADO ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (clearError) clearError();
    
    // Validaciones
    if (!email.trim() || !registerPassword.trim() || !confirmPassword.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    
    if (registerPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    console.log("Intentando registro con:", { email, password: "***" });

    // Usar la función register del contexto
    const result = await register({
      email,
      password: registerPassword,
      // Agrega otros campos que tu backend requiera:
      name: email.split('@')[0], // nombre por defecto
      username: email.split('@')[0] + Date.now(), // username único
    });
    
    if (result.success) {
      console.log("Registro exitoso, cerrando modal");
      onClose(); // Cierra modal y hace login automático
    } else {
      console.log("Error en registro:", result.error);
      setLocalError(result.error);
    }
  };

  // --- OLVIDÉ CONTRASEÑA ---
  const handleForgotPassword = (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email.trim()) {
      setLocalError('Por favor ingresa tu correo electrónico');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    // Simulación de envío de código
    alert(`Se envió un código de confirmación a ${email}`);
    setStep("resetCode");
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!resetCode.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    alert("Contraseña restablecida correctamente ✅");
    setStep("login");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  // Social logins
  const loginWithGoogle = () => {
    alert("Login con Google - Funcionalidad en desarrollo");
  };
  const loginWithFacebook = () => {
    alert("Login con Facebook - Funcionalidad en desarrollo");
  };
  const loginWithApple = () => {
    alert("Login con Apple - Funcionalidad en desarrollo");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Logo / Título */}
        <div className="modal-logo">
          <FaMapMarkerAlt className="logo-icon" />
          <span className="logo-text">Dónde Queda?</span>
        </div>
        <h2 className="modal-title">Bienvenido a Dónde Queda</h2>

        {/* Debug info - remover en producción */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '10px', color: '#706f6fff', marginBottom: '10px' }}>
            Estado: {step} | Loading: {loading ? 'Sí' : 'No'}
          </div>
        )}

        {/* Paso: ingreso de email */}
        {step === "email" && (
          <>
            <p className="modal-subtitle">Inicia sesión y sé parte de nuestra comunidad</p>
            <form onSubmit={checkEmail} className="modal-form">
              {/* Mostrar errores locales */}
              {localError && (
                <div className="error-message">
                  {localError}
                </div>
              )}
              
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
                disabled={loading}
              />
              <button 
                type="submit" 
                className="modal-button login-btn"
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>

              <div className="separator">o</div>

              <button type="button" className="modal-button google-btn" onClick={loginWithGoogle}>
                <FaGoogle /> Continuar con Google
              </button>
              <button type="button" className="modal-button facebook-btn" onClick={loginWithFacebook}>
                <FaFacebook /> Continuar con Facebook
              </button>
              <button type="button" className="modal-button apple-btn" onClick={loginWithApple}>
                <FaApple /> Continuar con Apple
              </button>
            </form>
          </>
        )}

        {/* Paso: login */}
        {step === "login" && (
          <form onSubmit={handleLogin} className="modal-form">
            {/* Mostrar errores */}
            {(error || localError) && (
              <div className="error-message">
                {localError || error}
              </div>
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="modal-input"
              disabled={loading}
            />
            
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modal-input password-input"
                disabled={loading}
              />
              <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            
            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); setStep("forgot"); }}>
              Olvidé mi contraseña
            </a>
            
            <button 
              type="submit" 
              className="modal-button login-btn"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
            
            <p style={{ marginTop: "0.5rem", cursor: "pointer", color: "blue" }} onClick={() => setStep("register")}>
              ¿No tienes cuenta? Regístrate
            </p>
          </form>
        )}

        {/* Paso: registro */}
        {step === "register" && (
          <>
            <p className="modal-subtitle">Regístrate y sé parte de nuestra comunidad</p>
            <form onSubmit={handleRegister} className="modal-form">
              {/* Mostrar errores */}
              {(error || localError) && (
                <div className="error-message">
                  {localError || error}
                </div>
              )}
              
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
                disabled={loading}
              />
              
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Crea una contraseña"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="password-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {confirmPassword && (
                <p style={{ color: registerPassword === confirmPassword ? "green" : "red", fontSize: "0.85rem" }}>
                  {registerPassword === confirmPassword ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                </p>
              )}

              <button
                type="submit"
                className="modal-button register-btn"
                disabled={loading || !registerPassword || !confirmPassword || registerPassword !== confirmPassword}
              >
                {loading ? 'Registrando...' : 'Regístrate'}
              </button>
              
              <p style={{ marginTop: "0.5rem", cursor: "pointer", color: "blue" }} onClick={() => setStep("login")}>
                ¿Ya tienes cuenta? Inicia sesión
              </p>
            </form>
          </>
        )}

        {/* Paso: olvidé contraseña */}
        {step === "forgot" && (
          <>
            <p className="modal-subtitle">Ingresa tu correo para restablecer tu contraseña</p>
            <form onSubmit={handleForgotPassword} className="modal-form">
              {/* Mostrar errores locales */}
              {localError && (
                <div className="error-message">
                  {localError}
                </div>
              )}
              
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
                disabled={loading}
              />
              <button 
                type="submit" 
                className="modal-button login-btn"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </form>
          </>
        )}

        {/* Paso: reset contraseña */}
        {step === "resetCode" && (
          <>
            <p className="modal-subtitle">Ingresa el código de confirmación que enviamos a <b>{email}</b></p>
            <form onSubmit={handleResetPassword} className="modal-form">
              {/* Mostrar errores locales */}
              {localError && (
                <div className="error-message">
                  {localError}
                </div>
              )}
              
              <input
                type="text"
                placeholder="Código de confirmación"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="modal-input"
                disabled={loading}
              />

              <div className="password-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="password-container">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  placeholder="Repite la nueva contraseña"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="modal-input password-input"
                  disabled={loading}
                />
                <span className="toggle-password" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                  {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {confirmNewPassword && (
                <p style={{ color: newPassword === confirmNewPassword ? "green" : "red", fontSize: "0.85rem" }}>
                  {newPassword === confirmNewPassword ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                </p>
              )}

              <button
                type="submit"
                className="modal-button login-btn"
                disabled={loading || !resetCode || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
              >
                {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}