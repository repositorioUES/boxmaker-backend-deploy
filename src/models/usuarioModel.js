
const mongoose = require('mongoose')
const schema = mongoose.Schema

const sumarUnMes = require('../misc/enUnMes')

//Sumar 30 días a partir de hoy para la fecha ce caducidad del password
let inOneMonth = sumarUnMes.enUnMes()

const usuarioSchema = new schema({
    fechaCreacion: {
        type: Date,
        default: Date.now
    },

    primerNombre: {
        type: String,
        require: true
    },
    segundoNombre: String,
    tercerNombre: String,

    primerApellido:  {
        type: String,
        require: true
    },
    segundoApellido: String,
    tercerApellido: String,

    userName: String,

    email:  {
        type: String,
        require: true
    },
    password:  {
        type: String,
        require: true
    },
    
    intentos: {
        type: Number,
        default: 0
    },
    passCaducidad: {
        type: Date,
        default: new Date(inOneMonth)
    },

    tipo: { //  ADMIN-GOD -> 0,  mortal (usuairo normal) -> 1 
        type: Number,
        default: 1
    },
    activo: {
        type: Boolean,
        default: true
    },
    bloqueado: {
        type: Boolean,
        default: false
    }
})

const usuario = mongoose.model('Usuario', usuarioSchema)

module.exports = usuario