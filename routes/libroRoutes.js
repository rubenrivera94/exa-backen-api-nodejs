const express = require('express');
const router = express.Router();
const libroController = require('../controllers/libroController');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');


// Configuración del almacenamiento de archivos con Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, uuid.v4() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Tipo de archivo no permitido'), false);
        }
        cb(null, true);
    }
});

// Nos aseguramos de que el directorio de carga exista
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Ruta para guardar un libro
router.post('/libros', upload.single('portada'), [
    body('ISBN').not().isEmpty().withMessage('El ISBN es obligatorio'),
    body('nombreLibro').not().isEmpty().withMessage('El nombre del libro es obligatorio'),
    body('autor').not().isEmpty().withMessage('El autor es obligatorio'),
    body('editorial').not().isEmpty().withMessage('La editorial es obligatoria'),
    body('paginas').isInt({ min: 1 }).withMessage('El número de páginas debe ser un número entero positivo')
], libroController.guardarLibro);

// Rutas para otras operaciones
router.get('/libros/buscar', libroController.buscarLibros);

router.get('/libros/:id?', libroController.listarLibros);

//ruta para actualizar libro
router.put('/libros/:id', upload.single('portada'), [
    body('ISBN').not().isEmpty().withMessage('El ISBN es obligatorio'),
    body('nombreLibro').not().isEmpty().withMessage('El nombre del libro es obligatorio'),
    body('autor').not().isEmpty().withMessage('El autor es obligatorio'),
    body('editorial').not().isEmpty().withMessage('La editorial es obligatoria'),
    body('paginas').isInt({ min: 1 }).withMessage('El número de páginas debe ser un número entero positivo')
], libroController.actualizarLibro);

router.delete('/libros/:id', libroController.eliminarLibro);

// Ruta para subir archivos (solo para pruebas)
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha cargado ningún archivo' });
    }
    res.status(201).json({ fileName: req.file.filename });
});

// Ruta para obtener archivos
router.get('/upload/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Archivo no encontrado' });
        }
    });
});

module.exports = router;
