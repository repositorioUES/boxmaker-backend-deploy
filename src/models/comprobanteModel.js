

const mongoose = require('mongoose')
const schema = mongoose.Schema

const compSchema = new schema({
    quedan : String,
    tipo : String,
    clave : String,
    fecha : Date, 
    correlativo : Number,
})

const comprobante = mongoose.model('Comprobante', compSchema)

module.exports = comprobante