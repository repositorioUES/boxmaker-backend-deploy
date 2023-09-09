

const mongoose = require('mongoose')
const schema = mongoose.Schema

//Sumar 10 años (3600 días) a partir de hoy para la fecha ce caducidad
let hoy = new Date()
let inTenYears = hoy.setFullYear(hoy.getFullYear() + 10)

const cajaSchema = new schema({
    fechaCreacion: {
        type: Date,
        default: Date.now
    },

    entidad: {
        type: String,
        default: 'AAC'
    },

    grupo: {
        type: String,
        default: 'AG'
    },

    numero : Number,
    codigo : String,

    descripcion : {
        type: String,
        require: true
    },
    
    estante : Number,
    nivel : Number, 
    
    caducidad : {
        type: Date,
        default: new Date(inTenYears)
    },
    usuario: String
})

const caja = mongoose.model('Caja', cajaSchema)

module.exports = caja