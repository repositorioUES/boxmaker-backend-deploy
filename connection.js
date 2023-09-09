
const mongoose = require('mongoose')
const { mongodb } = require("./config")

//const connection = mongoose.connect(`mongodb://${mongodb.host}:${mongodb.port}/${mongodb.database}`)
const connection = mongoose.connect(`mongodb+srv://${mongodb.user}:${mongodb.password}@${mongodb.database}.xpucgzi.mongodb.net/?retryWrites=true&w=majority`)
    .then((db)=>{
        console.log('Conexion Exitosa')
    }).catch((err)=>{
        console.log('Ha ocurrido un Error' + err)
    })

module.exports = connection