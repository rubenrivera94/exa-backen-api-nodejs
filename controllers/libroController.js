const Libro = require('../models/Libro'); // Asegúrate de que la ruta esté correcta
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');


exports.guardarLibro = async (req, res) => {
    // Validación de los campos enviados
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Datos del libro que serán guardados
        const libroData = {
            ISBN: req.body.ISBN,
            nombreLibro: req.body.nombreLibro,
            autor: req.body.autor,
            editorial: req.body.editorial,
            paginas: req.body.paginas
        };

        // Si se carga una portada, se asigna el archivo
        if (req.file) {
            libroData.portada = req.file.filename;
        }

        // Crear una nueva instancia del modelo Libro con los datos
        const libro = new Libro(libroData);
        await libro.save();  // Guardar el libro en la base de datos

        // Respuesta de éxito con el libro guardado
        res.status(201).json(libro);
    } catch (error) {
        console.error('Error al guardar el libro:', error);
        res.status(500).send('Error en el servidor');
    }
};

// Método para obtener todos los libros o un libro por su _id
exports.listarLibros = async (req, res) => {
    try {
        const { id } = req.params;  // Obtiene el _id del libro si está presente en los parámetros de la URL

        let libros;

        if (id) {
            // Si el _id está presente, busca el libro por su _id
            libros = await Libro.findById(id);

            if (!libros) {
                return res.status(404).json({ msg: 'Libro no encontrado' });
            }
        } else {
            // Si no se proporciona _id, devuelve todos los libros
            libros = await Libro.find();
        }

        res.json(libros);
    } catch (error) {
        console.error('Error al listar los libros:', error);
        res.status(500).send('Error en el servidor');
    }
};



// Método para actualizar un libro por su _id
exports.actualizarLibro = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { id } = req.params;
        let libro = await Libro.findById(id);

        if (!libro) {
            return res.status(404).json({ msg: 'Libro no encontrado' });
        }

        // Obtener los datos actualizados del cuerpo de la solicitud
        const updatedData = req.body;

        // Verificar si se ha subido un archivo (nueva portada)
        if (req.file) {
            // Asignar el nombre del archivo al campo 'portada'
            updatedData.portada = req.file.filename;

            // Opcional: eliminar la imagen anterior si se reemplaza la portada
            if (libro.portada && libro.portada !== updatedData.portada) {
                const oldImagePath = path.join(__dirname, '../uploads/', libro.portada);

                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error('Error al borrar la imagen anterior:', err);
                    } else {
                        console.log('Portada anterior eliminada:', libro.portada);
                    }
                });
            }
        }

        // Actualizar el libro con los nuevos datos (incluyendo la nueva portada si aplica)
        libro = await Libro.findByIdAndUpdate(id, updatedData, { new: true });

        res.json(libro);

    } catch (error) {
        console.error('Error al actualizar el libro:', error);
        res.status(500).send('Error en el servidor');
    }
};


// Método para eliminar (eliminar físicamente) un libro
exports.eliminarLibro = async (req, res) => {
    try {
        const { id } = req.params;  // Obtiene el _id del libro desde los parámetros de la URL
        const libro = await Libro.findByIdAndDelete(id);  // Busca y elimina el libro por su _id

        if (!libro) {
            return res.status(404).json({ msg: 'Libro no encontrado' });
        }

        res.json({ msg: 'Libro eliminado', libro });
    } catch (error) {
        console.error('Error al eliminar el libro:', error);
        res.status(500).send('Error en el servidor');
    }
};

// Método para realizar una búsqueda personalizada de libros
// El método de búsqueda personalizada permite buscar, autor, nombreLibro y editorial.
exports.buscarLibros = async (req, res) => {
    try {
        // Extrae los parámetros de búsqueda de la consulta (query)
        const { search, autor, nombreLibro, editorial } = req.query;

        // Crea un objeto para construir la consulta de búsqueda
        const query = {};

        // Filtrar parámetros vacíos y construir la consulta
        if (search && search.trim() !== '') {
            query.search = { $regex: search, $options: 'i' }; // 'i' para ignorar mayúsculas/minúsculas
        }
        if (autor && autor.trim() !== '') {
            query.autor = { $regex: autor, $options: 'i' };
        }
        if (nombreLibro && nombreLibro.trim() !== '') {
            query.nombreLibro = { $regex: nombreLibro, $options: 'i' };
        }
        if (editorial && editorial.trim() !== '') {
            query.editorial = { $regex: editorial, $options: 'i' };
        }

        console.log('Consulta de búsqueda:', query);

        // Realizar la búsqueda en la base de datos con los criterios construidos
        const libros = await Libro.find(query);

        // Enviar la lista de libros encontrados en la respuesta como JSON
        res.json(libros);
    } catch (error) {
        console.error('Error en la búsqueda de libros:', error);
        // Manejar errores de servidor y enviar una respuesta de error
        res.status(500).send('Error en el servidor');
    }
};

// Método para obtener los 3 últimos libros
exports.listarUltimosLibros = async (req, res) => {
    try {
        // Obtener los 3 últimos libros ordenados por la fecha de creación
        const libros = await Libro.find().sort({ createdAt: -1 }).limit(3);

        if (libros.length === 0) {
            return res.status(404).json({ msg: 'No hay libros disponibles' });
        }

        res.json(libros);
    } catch (error) {
        console.error('Error al listar los últimos libros:', error);
        res.status(500).send('Error en el servidor');
    }
};

