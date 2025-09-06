import React from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"; // Router SPA(single page application), routes(contenedor), route(ruta individual)
import Navbar from "../components/Navbar/Navbar";
import Home from "../pages/Home";
import Negocios from "../pages/Negocios";
import Eventos from "../pages/Eventos"
import Login from "../pages/Login"

const AppRoutes = () =>  //organiza rutas y navbar
{
    return(
    <Router>
        <Navbar/>
            <Routes>
                <Route path ="/" element={<Home />}/>     
                <Route path ="/negocios" element={<Negocios/>} /> 
                <Route path ="/eventos" element={<Eventos/>} />
                <Route path ="/login" element={<Login/>} />
            </Routes>
    </Router>
    );
};

export default AppRoutes;