const express = require("express");
const mysql = require("mysql");
const util = require("util");

const app = express();
const port = 3000;
app.use(express.json()); // permite el mapeo de json a js (de la peticion)

// Creamos conexion con la BD
const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "lista_super_bd",
});

// Verificamos la conexion
conn.connect((error) => {
  if (error) {
    throw error;
  }
  console.log("Conexión con la BD establecida.");
});

const qy = util.promisify(conn.query).bind(conn); // Permite el uso de async/await en la conexion mysql. Transforma las callbak en promise

// DESARROLLO DE LA LOGICA DE NEGOCIO
/**
 * CATEGORIA DE PRODUCTOS
 * GET para devolver todas las categorias
 * GET id para devolver uno solo
 * POST para guardar una categoria nueva
 * PUT para modificar una cat existente
 * DELETE para borrar una cat existente
 *
 * Ruta -> /categoria
 */

 // DEVUELVE TODAS LAS CATEGORIAS
app.get("/categoria", async (req, res) => {
  try {
    const query = "SELECT * FROM categoria";

    const respuesta = await qy(query); // Hacemos la consulta "promisificada"

    res.send({ "respuesta": respuesta }); // mandamos un JSON con la respuesta
  }
    catch (e) {
    console.error(e.mesage);
    res.status(413).send({ "Error": e.message });
  }
});

// DEVUELVE UNA CATEGORIA ESPECIFICA
app.get("/categoria/:id", async (req, res) => {
    try {
      const query = "SELECT * FROM categoria WHERE id = ?";
  
      const respuesta = await qy(query, [req.params.id]); // Hacemos la consulta, con el dato del id como un array

      console.log(respuesta); // Para ver la estructura de la respuesta (es un array)

      res.send({ "respuesta": respuesta }); // mandamos un JSON con la respuesta
    }
      catch (e) {
      console.error(e.mesage);
      res.status(413).send({ "Error": e.message });
    }
  });

  // GUARDA UNA NUEVA CATEGORIA
  app.post("/categoria", async (req, res) => {
    try {
         // Comprobamos existencia del parámetro:
        if (!req.body.nombre) {
            throw new Error("Falta enviar el nombre!"); // Si no existe, arroja error, sale del try y pasa directo al catch
        }

        // convertimos string nombre a mayúsculas así evitamos repeticiones
        const nombre = req.body.nombre.toUpperCase();

        // Verificamos si existe el mismo nombre en la BD
        let query = "SELECT id FROM categoria WHERE nombre = ?";
        let respuesta = await qy(query, [nombre]);

        if (respuesta.length > 0) { //como la consulta siempre nos devuelve un array, comprobamos si tiene elementos ese array
            throw new Error("Esa cataegoria ya existe");
        }

        //Guardamos la nueva categoria
         query = "INSERT INTO categoria (nombre) VALUES (?)";

         respuesta = await qy(query, [nombre]);

         res.send({ "respuesta": respuesta }); // mandamos un JSON con la respuesta


    }
      catch (e) {
      console.error(e.mesage);
      res.status(413).send({ "Error": e.message });
    }
  });


  // MODIFICA UNA CATEGORIA EXISTENTE
  app.put("/categoria/:id", async (req, res) => {
      try {
        if (!req.body.nombre) {
            throw new Error("Falta enviar el nombre!"); // Comprobamos envío de nombre
        }
        // convertimos string nombre a mayúsculas así evitamos repeticiones
        const nombre = req.body.nombre.toUpperCase();

        // Nos guardamos el id
        const id = req.params.id;

        // Preguntamos si existe otra categoría (otro id) con el mismo nombre que vamos a darle a la categoria que queremos modificar
        let query = "SELECT * FROM categoria WHERE nombre = ? AND id <> ?";

        let respuesta = await qy(query, [nombre, id]);

        if (respuesta.length > 0) {
            throw new Error("El nombre de la categoria que querés poner ya existe!");
        }

        query = "UPDATE categoria SET nombre = ? WHERE id = ?";

        respuesta = await qy(query, [nombre, id]);
 
        res.send({"respuesta": respuesta.affectedRows}); 
      }
      catch (e) {
        console.error(e.mesage);
        res.status(413).send({ "Error": e.message });
      }
  });

  // BORRAR UNA CATEGORIA
  // (unicamente si no hay otros productos asociados en la BD, para no perder integridad)
  app.delete("/categoria/:id", async (req, res) => {
      try {
        if (!req.body.nombre) {
            throw new Error("Falta enviar el nombre!");
        }
        const nombre = req.body.nombre.toUpperCase();
        const id = req.params.id;

         // Copmprobamos si nhay productos con dicha categoria
        let query = "SELECT * FROM producto WHERE categoria_id = ?";
        let respuesta = await qy(query, [id]);

        if (respuesta.length > 0) {
            throw new Error("Esta categoria tiene productos asociados, no se puede eliminar");
        }

        // Si pasamos la verificacion, entonces borramos
        query = "DELETE FROM categoria WHERE id = ?";
        respuesta = await qy(query, [id]);

        res.send({"respuesta": respuesta.affectedRows});
      }
      catch (e) {
        console.error(e.mesage);
        res.status(413).send({ "Error": e.message });
      }
  });

/**
 * PRODUCTOS
 *
 * Ruta -> /productos
 */

 app.post("/producto", async (req, res) => {
     try {
        if (!req.body.nombre || !req.body.categoria_id) {
            throw new Error("No enviaste todos los datos obligatorios!");
        }

        const nombre = req.body.nombre.toUpperCase();
        const categoria_id = req.body.categoria_id;

        let query = "SELECT * FROM categoria WHERE id = ?";
        let respuesta = await qy(query, [categoria_id]);

        if (respuesta.length == 0) {
            throw new Error("Esa categoria no existe!");
        }

        query = "SELECT * FROM producto WHERE nombre = ?";
        respuesta = await qy(query, [nombre]);

        if (respuesta.length > 0) {
            throw new Error("Ese producto ya existe!");
        }

        let descripcion = "";
        if (req.body.descripcion){
            descripcion = req.body.descripcion;
        }

        //Guardamos el nuevo producto
        query = "INSERT INTO producto (nombre, descripcion, categoria_id) VALUES (?, ?, ?)";

        respuesta = await qy(query, [nombre, descripcion, categoria_id]);

        res.send({ "respuesta": respuesta.insertId });


     }
     catch (e) {
        console.error(e.mesage);
        res.status(413).send({ "Error": e.message });
      }

 });

/**
 * LISTAS DE COMPRAS
 *
 * Ruta -> /lista
 */

// Iniciamos el servidor
app.listen(port, () => {
  console.log("Escuchando el puerto " + port);
});
