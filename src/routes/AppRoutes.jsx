import React from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Home from "../pages/Home";
import Negocios from "../pages/Negocios";   
import Eventos from "../pages/Eventos";
import Login from "../pages/Login";
import Profile from "../pages/Profile"; // ← Este import
import SearchPage from "../pages/SearchPage";
const AppRoutes = () => {
    return(
    <Router>
        <Navbar/>
            <Routes>
                <Route path="/" element={<Home />} />     
                <Route path="/negocios" element={<Negocios />} /> 
                <Route path="/negocios/:id" element={<Negocios />} />
                <Route path="/Mycommerce" element={<Negocios isOwner={true} />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<Login />} />
            </Routes>
    </Router>
    );
};

export default AppRoutes;