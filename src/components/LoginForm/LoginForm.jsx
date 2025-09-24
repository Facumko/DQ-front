import { useState, useContext } from "react";
import { UserContext } from "../../pages/UserContext";
import { loginUser, registerUser } from "../Api/Api";

export default function LoginForm() {
  const { user, login, logout } = useContext(UserContext);
  const [step, setStep] = useState("login"); // login o register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerLastname, setRegisterLastname] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerRecoveryEmail, setRegisterRecoveryEmail] = useState("");

  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      const data = await loginUser(email, password);
      login({ name: data.name }); // solo guardamos el nombre por ahora
      setEmail("");
      setPassword("");
    } catch (err) {
      alert(err.message || "Error al iniciar sesión");
    }
  };

  // --- REGISTRO ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !registerName || !registerLastname || !registerUsername || !registerRecoveryEmail) {
      alert("Completa todos los campos");
      return;
    }
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      const data = await registerUser({
        email,
        password,
        name: registerName,
        lastname: registerLastname,
        username: registerUsername,
        recovery_email: registerRecoveryEmail,
      });
      login({ name: data.name });
      setStep("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRegisterName("");
      setRegisterLastname("");
      setRegisterUsername("");
      setRegisterRecoveryEmail("");
    } catch (err) {
      alert(err.message || "Error al registrar usuario");
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", marginTop: "1rem" }}>
      {user ? (
        <div>
          <p>Sesión iniciada como <b>{user.name}</b></p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      ) : (
        <>
          {step === "login" ? (
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit">Iniciar sesión</button>
              <p style={{ marginTop: "0.5rem", cursor: "pointer", color: "blue" }} onClick={() => setStep("register")}>
                ¿No tienes cuenta? Regístrate
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Nombre"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Apellido"
                value={registerLastname}
                onChange={(e) => setRegisterLastname(e.target.value)}
              />
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="email"
                placeholder="Correo de recuperación"
                value={registerRecoveryEmail}
                onChange={(e) => setRegisterRecoveryEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit">Registrarse</button>
              <p style={{ marginTop: "0.5rem", cursor: "pointer", color: "blue" }} onClick={() => setStep("login")}>
                ¿Ya tienes cuenta? Inicia sesión
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
}
