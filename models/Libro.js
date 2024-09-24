const mongoose = require('mongoose');
const { Schema } = mongoose;

const libroSchema = new Schema({
    ISBN: { type: String, required: true },
    nombreLibro: { type: String, required: true },
    autor: { type: String, required: true },
    editorial: { type: String, required: true },
    portada: { type: String, default: '' },
    paginas: { type: Number, required: true }
});

module.exports = mongoose.model('Libro', libroSchema);
