import { useState, useContext } from "react";
import { UserContext } from "../../pages/UserContext";
import "./LoginModal.css";
import { loginUser, registerUser } from "../../Api/Api";
import { FaEye, FaEyeSlash, FaMapMarkerAlt, FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

export default function LoginModal({ onClose }) {
  const { login } = useContext(UserContext);
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Restablecer contraseña
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const checkEmail = (e) => {
    e.preventDefault();
    if (!email) return;
    // Simulación: si termina en @test.com, login, si no registro
    if (email.endsWith("@test.com")) {
      setStep("login");
    } else {
      setStep("register");
    }
  };

  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      const data = await loginUser(email, password); // llamada al backend
      login({ name: data.name }); // sin token todavía
      onClose();
    } catch (err) {
      alert(err.message || "Error al iniciar sesión");
    }
  };

  // --- REGISTRO ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (!registerPassword.trim()) return;

    try {
      const data = await registerUser(email, registerPassword); // llamada al backend
      login({ name: data.name }); // login automático
      onClose();
    } catch (err) {
      alert(err.message || "Error al registrar usuario");
    }
  };

  // --- OLVIDÉ CONTRASEÑA ---
  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Simulación de envío de código
    alert(`Se envió un código de confirmación a ${email}`);
    setStep("resetCode");
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (resetCode.trim() && newPassword.trim()) {
      alert("Contraseña restablecida correctamente ✅");
      setStep("login");
    }
  };

  // Social logins
  const loginWithGoogle = () => {
    window.location.href = "https://accounts.google.com/o/oauth2/v2/auth?...";
  };
  const loginWithFacebook = () => {
    window.location.href = "https://www.facebook.com/v10.0/dialog/oauth?...";
  };
  const loginWithApple = () => {
    window.location.href = "https://appleid.apple.com/auth/authorize?...";
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

        {/* Paso: ingreso de email */}
        {step === "email" && (
          <>
            <p className="modal-subtitle">Inicia sesión y sé parte de nuestra comunidad</p>
            <form onSubmit={checkEmail} className="modal-form">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
              />
              <button type="submit" className="modal-button login-btn">Continuar</button>

              <div className="separator">o</div>

              <button type="button" className="modal-button google-btn" onClick={loginWithGoogle}><FaGoogle /> Continuar con Google</button>
              <button type="button" className="modal-button facebook-btn" onClick={loginWithFacebook}><FaFacebook /> Continuar con Facebook</button>
              <button type="button" className="modal-button apple-btn" onClick={loginWithApple}><FaApple /> Continuar con Apple</button>
            </form>
          </>
        )}

        {/* Paso: login */}
        {step === "login" && (
          <form onSubmit={handleLogin} className="modal-form">
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modal-input password-input"
              />
              <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); setStep("forgot"); }}>Olvidé mi contraseña</a>
            <button type="submit" className="modal-button login-btn">Iniciar sesión</button>
          </form>
        )}

        {/* Paso: registro */}
        {step === "register" && (
          <>
            <p className="modal-subtitle">Regístrate y sé parte de nuestra comunidad</p>
            <form onSubmit={handleRegister} className="modal-form">
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Crea una contraseña"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="modal-input password-input"
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
                disabled={!registerPassword || !confirmPassword || registerPassword !== confirmPassword}
              >
                Regístrate
              </button>
            </form>
          </>
        )}

        {/* Paso: olvidé contraseña */}
        {step === "forgot" && (
          <>
            <p className="modal-subtitle">Ingresa tu correo para restablecer tu contraseña</p>
            <form onSubmit={handleForgotPassword} className="modal-form">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
              />
              <button type="submit" className="modal-button login-btn">Enviar código</button>
            </form>
          </>
        )}

        {/* Paso: reset contraseña */}
        {step === "resetCode" && (
          <>
            <p className="modal-subtitle">Ingresa el código de confirmación que enviamos a <b>{email}</b></p>
            <form onSubmit={handleResetPassword} className="modal-form">
              <input
                type="text"
                placeholder="Código de confirmación"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="modal-input"
              />

              <div className="password-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="modal-input password-input"
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
                disabled={!resetCode || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
              >
                Restablecer contraseña
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
