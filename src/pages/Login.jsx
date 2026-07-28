import React from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginForm/LoginModal";

// acá simplemente lo mostramos cuando alguien entra directo a /login.
const Login = () => {
  const navigate = useNavigate();
  return <LoginModal onClose={() => navigate("/")} />;
};

export default Login;