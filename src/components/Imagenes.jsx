import React, { useEffect, useState } from "react";
import axios from "axios";

const Imagenes = () => {
  const [imagenes, setImagenes] = useState([]);
  const [url, setUrl] = useState("");
  const [tipo, setTipo] = useState("");

  // 1️⃣ Traer imágenes del backend
  const traerImagenes = () => {
    axios.get("http://localhost:8080/imagen/traer")
      .then(res => setImagenes(res.data))
      .catch(err => console.error("Error al traer imágenes:", err));
  };

  useEffect(() => {
    traerImagenes();
  }, []);

  // 2️⃣ Subir nueva imagen
  const subirImagen = (e) => {
    e.preventDefault();
    if (!url || !tipo) return alert("Completa todos los campos");

    axios.post("http://localhost:8080/imagen/guardar", { url, tipo })
      .then(res => {
        console.log("Imagen guardada:", res.data);
        setUrl("");
        setTipo("");
        traerImagenes(); // refresca la lista
      })
      .catch(err => console.error("Error al guardar imagen:", err));
  };

  return (
    <div>
      <h2>Gestión de Imágenes</h2>

      {/* Formulario para subir imagen */}
      <form onSubmit={subirImagen} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="URL de la imagen"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Tipo (perfil, banner, etc)"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button type="submit">Subir Imagen</button>
      </form>

      {/* Listado de imágenes */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {imagenes.map((img, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <img
              src={img.url}
              alt={img.tipo}
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
            <p>{img.tipo}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Imagenes;
