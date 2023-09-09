

const mongoose = require('mongoose')
const schema = mongoose.Schema

const contSchema = new schema({
    caja : String,
    tipo : String,
    clave : String,
    fecha : Date, 
    correlativo : String
})

const contenido = mongoose.model('Contenido', contSchema)

module.exports = contenido