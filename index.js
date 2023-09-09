
const express = require('express')
const app = express()
const path = require('path')
const cors = require('cors');

if(process.env.NODE_ENV != 'production'){
    require('dotenv').config()
}

const connection = require('./connection') //Ejecutar la conexión con la BD
const port = process.env.PORT || 5999

const cajaRoutes = require('./src/routes/cajaRoutes')
const contRoutes = require('./src/routes/contenidoRoutes')
const compRoutes = require('./src/routes/comprobanteRoutes')
const userRoutes = require('./src/routes/usuarioRoutes')

//Settings
app.set('views',path.join(__dirname, 'views')) //VISTAS PARA TESTEO, BORRAR DESPUES

//Middlewares
app.use(express.json()) //MW para recibir json
app.use(express.urlencoded({ extended: false })) //MW para visualizar datos recibidos del cliente en un form.
app.use(express.static(path.join(__dirname, 'public'))) //MW para archivos estáticos

//cors
const whiteList=['http://localhost:4200','...'];
app.use(cors({origin: whiteList}));

//Rutas
app.use('/caja', cajaRoutes)
app.use('/contenido', contRoutes)
app.use('/comprobante', compRoutes)
app.use('/usuario', userRoutes)


app.get('/', (req, res) => {
    res.send('Bienvenido')
})

app.listen(port, () => {
    console.log(`BoxMaker corriendo en el puerto ${port}`)
})