
const Usuario = require('../models/usuarioModel')

const authorized = async (req, res, next) => {

    const user = await Usuario.findOne({_id: req.loggedUserId})

    if (!user) {
        res.status(400).send({msg:"PermMW: Usuario no encontrado"})
    } else {
        if (user.tipo == 0) {
            next()
        } else {
            res.status(400).send({msg:"PermMW: Sólo el Administrador puede realizar ésta acción"})
        }
    }
}

exports.authorized = authorized