import express from "express";
import alumnos from "./alumnos.json" with { type: "json" };
import { randomUUID } from "crypto";

const app = express();
const port = 3000;

// Comentario 1: para GIT.

app.use(express.json());

app.use((req, res, next) => {
  // validar Acceso. Todos los usuarios deben estar logeados.
  const login = true;
  if (!login) {
    return res.status(401).send({ error: "Acceso no autorizado." });
  }
  next();
});

const adminPermisoMiddleware = (req, res, next) => {
  const adminPerimso = true;
  if (!adminPerimso) {
    return res.status(403).send({ error: "Permiso denegado." });
  }
  next(); // sigue a: app.delete("/alumno/:nro", adminPermisoMiddleware, (req, res) => {}
};

app.get("/", (req, res) => {
  res.send("Server ON.");
});

// RECUPERA Alumnos.
app.get("/alumnos", (req, res) => {
  const { limite = 2, offset = 1, apellido, estado, sexo } = req.query;
  let alumnosFiltro = [...alumnos];

  if (apellido) {
    alumnosFiltro = alumnosFiltro.filter((a) =>
      a.apellido.toLowerCase().includes(apellido.toLowerCase()),
    );
  }

  if (estado) {
    alumnosFiltro = alumnosFiltro.filter((a) => a.estado === estado);
  }

  if (sexo) {
    alumnosFiltro = alumnosFiltro.filter((a) => a.sexo === sexo);
  }

  // paginacion
  const inicio = parseInt(offset);
  const fin = inicio + parseInt(limite);
  alumnosFiltro = alumnosFiltro.slice(inicio, fin);

  res.json(alumnosFiltro);
});

// RECUPERA Un Alumno.
app.get("/alumno/:nro", (req, res) => {
  const nro = parseInt(req.params.nro);
  const alumno = alumnos.find((a) => a.nro_alumno === nro);
  if (alumno) {
    res.json(alumno);
  } else {
    res.status(404).send(`Alumno ${nro} no encontrado.`);
  }
});

// ALTA Alumno.
app.post("/alumno", (req, res) => {
  const {
    apellido,
    nombre,
    dni,
    nro_legajo,
    fecha_nacimiento,
    sexo,
    mail,
    calle,
    nro,
    unidad,
    cod_postal,
    estado,
  } = req.body;

  if (!apellido || !nombre || !dni || !nro_legajo) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios para crear el alumno." });
  }

  const yaExiste = alumnos.some((a) => a.dni === dni);
  if (yaExiste) {
    return res
      .status(409)
      .json({ error: `Ya existe un alumno con DNI ${dni}.` });
  }
  // nro_alumno: randomUUID(),
  const nuevoAlumno = {
    nro_alumno: 2502,
    apellido,
    nombre,
    dni,
    nro_legajo,
    fecha_nacimiento: fecha_nacimiento || null,
    sexo: sexo || null,
    mail: mail || null,
    calle: calle || null,
    nro: nro || null,
    unidad: unidad || null,
    cod_postal: cod_postal || null,
    estado: estado || "ACT",
  };

  alumnos.push(nuevoAlumno);
  res.status(201).json({ mensaje: "Alumno creado.", alumno: nuevoAlumno });
});

// MODIFICA Alumno.
app.patch("/alumno", (req, res) => {
  const {
    nro_alumno,
    apellido,
    nombre,
    nro_legajo,
    sexo,
    mail,
    calle,
    nro,
    unidad,
    cod_postal,
  } = req.body;

  if (!nro_alumno) {
    return res.status(400).json({
      error: `Nro Alumno no recibido.`,
    });
  }

  const indiceAlumno = alumnos.findIndex(
    (a) => String(a.nro_alumno) === String(nro_alumno),
  );

  if (indiceAlumno === -1) {
    return res
      .status(404)
      .json({ error: `Alumno ${nro_alumno} no encontrado.` });
  }

  const alumnoActualizado = {
    ...alumnos[indiceAlumno],
    apellido: apellido ?? alumnos[indiceAlumno].apellido,
    nombre: nombre ?? alumnos[indiceAlumno].nombre,
    nro_legajo: nro_legajo ?? alumnos[indiceAlumno].nro_legajo,
    sexo: sexo ?? alumnos[indiceAlumno].sexo ?? null,
    mail: mail ?? alumnos[indiceAlumno].mail ?? null,
    calle: calle ?? alumnos[indiceAlumno].calle ?? null,
    nro: nro ?? alumnos[indiceAlumno].nro ?? null,
    unidad: unidad ?? alumnos[indiceAlumno].unidad ?? null,
    cod_postal: cod_postal ?? alumnos[indiceAlumno].cod_postal ?? null,
  };

  alumnos[indiceAlumno] = alumnoActualizado;
  res
    .status(200)
    .json({ mensaje: "Alumno modificado.", alumno: alumnoActualizado });
});

// BORRAR Alumno.
app.delete("/alumno/:nro", adminPermisoMiddleware, (req, res) => {
  const nro = parseInt(req.params.nro);
  const indiceAlumno = alumnos.findIndex((a) => a.nro_alumno === nro);

  if (indiceAlumno === -1) {
    return res.status(404).json({ error: `Alumno ${nro} no encontrado.` });
  }

  if (alumnos[indiceAlumno].estado !== "BAJ") {
    return res.status(400).json({
      error: `Alumno ${nro} no puede ser eliminado si su estado no es BAJA.`,
    });
  }

  alumnos.splice(indiceAlumno, 1);
  res.status(200).json({ mensaje: `Alumno ${nro} eliminado.` });
});

if (process.env.NODE_ENV !== "production") {
  // Levantar el servidor
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;
