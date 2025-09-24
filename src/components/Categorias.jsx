import React, { useEffect, useState } from "react";
import axios from "axios";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    axios.get("http://192.168.1.6:8080/categoria/traer")
      .then(res => setCategorias(res.data))
      .catch(err => console.error("Error al traer categorías:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}> 
      <h2>Categorías</h2>
      <ul>
        {categorias.map((cat, i) => (
          <li key={i}>{cat.name} - {cat.description}</li>
        ))}
      </ul>
    </div>
  );
};

export default Categorias;
