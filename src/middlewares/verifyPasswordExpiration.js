

const { login } = require('../controllers/usuarioController')
const Usuario = require('../models/usuarioModel')

const expiration = async (req, res, next) => {

    const user = await Usuario.findById(req.loggedUserId)
    const today = new Date()
    
    if (!user) {
        res.status(400).send({ ok: false, msg: "ExpMW: Usuario no encontrado" })
    } else {
        if (user.passCaducidad <= today){
            console.log('Caducao');
            res.status(400).send({ ok: false, msg: "Su contraseña Ha Caducado, NO tiene permitido realizar ésta acción hasta que la actualice" })
        }
        else{
            next()
        }
    }


}

exports.expiration = expiration