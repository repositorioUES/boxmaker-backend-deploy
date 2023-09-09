

const Usuario = require('../models/usuarioModel')
const bcrypt = require('bcrypt')

async function createAdmin (req, res){

    const prevUser = await Usuario.findOne({tipo: 0, userName:'ADMIN'}) //debe haber al menos un admin
    
    if (!prevUser){
        const user = new Usuario({
            primerNombre: 'Administrador',
            primerApellido: 'del Sistema',
            userName: 'ADMIN',
            email: 'admin@cel.gob.sv',
            password: bcrypt.hashSync('archivo', 10),
            tipo: 0,
        })

        try { 
            const newUser = await user.save()
            if (!newUser) {
                res.status(400).send({ok: false, msg:"Ha ocurrido un error, No se ha guardado el Usuario."})
            }else{
                res.status(200).send({ok: true, msg: "Administrador creado"})
            }
        } catch (err) {
            res.status(500).send({ok: false, msg:"Ha ocurrido un error al crear al Admin: " + err})
        }
    }else{
        res.status(400).send({ok: false, msg:"Ya existe un Administrador Base"})
    }
}

module.exports = {
    createAdmin
}