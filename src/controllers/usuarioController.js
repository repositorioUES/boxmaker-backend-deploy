
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const Validators = require('../../validators')

const Usuario = require('../models/usuarioModel')
const sumarUnMes = require('../misc/enUnMes')

async function register (req, res){
    
    const data = req.body
    
    const prevUser = await Usuario.findOne({tipo: 0}) //debe haber al menos un admin

//VALIDACIÓN DE DATOS ==============================================================================
    let errors = ''

    const validateNames = validarNombre(data.primerNombre, data.segundoNombre, data.primerApellido, data.segundoApellido)
    if(validateNames != "" && validateNames != null){
        errors += validateNames  
    }
    
    const reqNames = requireNombre(data.primerNombre, data.segundoNombre, data.primerApellido, data.segundoApellido)
    if(reqNames != ' es Obligatorio' && reqNames != null){
        errors += reqNames  
    }
    
    if(errors != ''){
        res.status(400).send({ok: false, msg: errors})
        return
    }
//=============================================================================

    // Si NO hay admin, el primero que se creará será el ADMIN-GOD===============================================
    const user = new Usuario()
    if (!prevUser){ 
        user.primerNombre = 'Administrador',
        user.primerApellido = 'del Sistema',
        user.userName = 'ADMIN',
        user.email = data.email,
        user.password = bcrypt.hashSync('archivo', 10),
        user.tipo = 0,
    
        await permisoController.crearPermisos()

    }else{
        // CONSTRUIR EL NOMBRE DE USUAARIO ============================================
        let userName = ""
        let seguir = true
        let pasadas = 0 //Cantidad de veces que se debe pasar para armar el userName si está repetido
        while (seguir) { // Construir el userName a partir de las iniciales y el apellido
            userName = createUserName(
                data.primerNombre.replace(/\s+/g,""), 
                data.segundoNombre.replace(/\s+/g,""),
                data.primerApellido.replace(/\s+/g,""), 
                pasadas
            )

            const prevUserName = await Usuario.findOne({"userName": userName})
        
            if(!prevUserName){
                seguir = false
            }else{
                pasadas++
            }
        }
        //=============================================================================

        user.primerNombre = data.primerNombre,
        user.segundoNombre = data.segundoNombre,
        user.tercerNombre = data.tercerNombre,
        user.primerApellido = data.primerApellido,
        user.segundoApellido = data.segundoApellido,
        user.tercerApellido = data.tercerApellido,
        
        user.userName = userName,
        user.email = userName + '@cel.gob.sv',
        user.password = bcrypt.hashSync('archivo', 10)
    }

    try { // GUARDADO DEL USUARIO
        const newUser = await user.save()
        if (!newUser) {
            res.status(400).send({ok: false, msg:"Ha ocurrido un error, No se ha guardado el Usuario."})
        }else{
            if(newUser.tipo == 0){
                await permisoController.asignarPermisosAdmin(newUser._id)
            }
            res.status(200).send({ok: true, newUser: newUser})
        }
    } catch (err) {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error al crear el Usuario: " + err})
    }
}

async function login (req, res){
    
    try {                     // Sólo so el usuario no está bloqueado o inactivo.
        const user = await Usuario.findOne({"userName": { $regex: req.body.userName, $options:'i' } })
        if (!user) {
            res.status(400).send({ok: false, msg:"Usuario o Contraseña no Válidos."})
        } else {
            if (user.activo == true && user.bloqueado == false) {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    await Usuario.findOneAndUpdate({"userName": user.userName},{"intentos": 0})//si el pass es correcto reseteamos el
                    jwt.sign({user: user}, process.env.SECRET_KEY, (err, token, userName)=>{
                        res.status(200).send({ok: true, token: token, username: user.userName, tipo: user.tipo})
                    })
                } else if(user.tipo != 0) {
                    let intentos = user.intentos
                    const updated = await Usuario.findOneAndUpdate({"userName": user.userName},{"intentos": (intentos + 1)})
                    if (!updated) {
                        res.status(400).send({ok: false, msg: "Error al incrementar el contador de intentos"})
                    } else {
                        if(intentos >= 4){
                            const block = await Usuario.findOneAndUpdate({"userName": user.userName},{"bloqueado": true})
                            if (!block) {
                                res.status(400).send({ok: false, msg: "Ha ocurrido un error al bloquear al Usuario"})
                            } else {
                                res.status(400).send({ok: false, msg: "Su Usuario ha sido bloqueado, contacte con el Administrador."})
                            }
                        } else {
                            res.status(400).send({ok: false, msg: "Usuario o Contraseña no Válidos, intentos restantes: " + (4 - intentos).toString()})
                        }
                    }
                } else {
                    res.status(400).send({ok: false, msg: "Usuario o Constraseña no Válidos"})
                }
            } else {
                res.send({ok: false, msg: "Usuario " + user.userName + " se encuentra Inactivo o Bloqueado"})
            }
        }
    } catch (err) {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
    }
}

const profile = async (req, res) => {

    jwt.verify(req.token, process.env.SECRET_KEY, async (err, userFound)=>{
        if (err) {
            res.status(500).send({msg:"Ha ocurrido un error al cargar el perfil: " + err})
        } else {
    
            const userData =  await Usuario.findById(userFound.user._id)
        
            if (!userData) {
                res.status(400).send({ok: false, msg:"No se ha encontrado al Usuario"})
            } else {
                let vence = "" // Mansaje de advertencia, si aún no es tiempo, está vacio
                const today = new Date() // fecha de hoy
                
                //restamos 5 días para comenzar a avisar
                let fiveDaysBefore = new Date(userData.passCaducidad.getFullYear(), userData.passCaducidad.getMonth(), (userData.passCaducidad.getDate() - 19)) 
                const daysLeft = Math.round((userData.passCaducidad - today) / 86400000)

                if(today >= fiveDaysBefore){
                    vence = "Su contraseña caducará el: " + formatDate(userData.passCaducidad)
                }

                const currUser = {
                    primerNombre: userData.primerNombre,
                    segundoNombre: (userData.segundoNombre ? userData.segundoNombre : "-"),
                    tercerNombre: (userData.tercerNombre ? userData.tercerNombre : "-"),
                    primerApellido: userData.primerApellido,
                    segundoApellido: (userData.segundoApellido ? userData.segundoApellido : "-"),
                    tercerApellido: (userData.tercerApellido ? userData.tercerApellido : "-"),
                    
                    _id: userData._id,
                    userName: userData.userName,
                    email: userData.email,
                    tipo: userData.tipo,
                    passCaducidad: formatDate(userData.passCaducidad),
                }

                const warnings = {
                    dias: "Faltan " + daysLeft + " Días",
                    fecha: vence
                }

                res.status(200).send({ userData: currUser, warning: warnings})
            }
        }   
    })

}

function createUserName(pn, sn, pa, pasada){
    let inicial_1 = pn.substring(0, 1).toUpperCase() //Inicial del primer nombre
    let apellidoInicial = pa.charAt(0).toUpperCase() //Inicial del apellido en mayúscula
    let apellido = pa.substring(1, pa.length) //retos de apellido sin inicial

    let finalName = inicial_1 + apellidoInicial + apellido
    
    if (pasada > 0) { //Si ya existe el userName, hacemos varias "pasadas" para crear otro
        
        let inicial_2 = ""
        if (sn != null || sn!= "") {
            if (pasada <= sn.length) {
                inicial_2 = sn.substring(0, pasada)
            } else {
                // Si ya no hay variaciones para los userName se le concatenará un NUMERO para hacerlo único de alguna mmanera XD
                inicial_2 = sn + pasada.toString()
            }
        }else{
            if (pasada <= pn.length) {
                inicial_2 = pn.substring(1, pasada)
            } else {
                // Si ya no hay variaciones para los userName se le concatenará un NUMERO para hacerlo único de alguna mmanera XD
                inicial_2 = pn + pasada.toString()
            }
        }
        inicial_2.charAt(0).toUpperCase()

        finalName = inicial_1 + inicial_2 + apellidoInicial + apellido
    }
   
    return finalName
}

async function resetPassword (req, res){
    const id = req.params.id
    const basePassword = 'archivo'

    //Sumar 30 días a partir de hoy para la fecha ce caducidad del password
    let inOneMonth = sumarUnMes.enUnMes()

    try {
        const usuario = await Usuario.findById(id)

        if (!usuario) {
            res.status(400).send({ok: false, msg:"Usuario no encontrado."})
        } else {
            const pass = bcrypt.hashSync(basePassword, 10)
            const upadated = await Usuario.findOneAndUpdate({_id: id}, {password: pass, passCaducidad: new Date(inOneMonth)})

            if (!upadated) {
                res.status(400).send({ok: false, msg:"No se ha podido resetear la Contraseña del Usuario '" + usuario.userName})
            } else {
                res.status(200).send({ok: true, msg:"Contraseña del Usuario '" + usuario.userName + "' ha sido restablecida como: " + basePassword})
            }
        }
    } catch (err) {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error al resetear la contraseña: " + err})
    }
}

async function changePassword (req, res){
    const data = req.body.data
    const currPass = data.password
    const newPass = data.newPassword

    //Sumar 30 días a partir de hoy para la fecha ce caducidad del password
    let inOneMonth = sumarUnMes.enUnMes()
    
    try {
       
        const usuario = await Usuario.findOne({userName: data.userName})
    
        if (!usuario) {
            res.status(400).send({ok: false, msg:"Usuario o Contraseña no Válidos."})
        } else {
            if (bcrypt.compareSync(currPass, usuario.password)) {
                if (currPass == newPass) {
                    res.status(400).send({ok: false, msg:"La contraseña nueva no puede ser igual a la anterior."})
                } else {
                    try {
                        let p = bcrypt.hashSync(newPass, 10)
                        const updated = await Usuario.findOneAndUpdate({userName: usuario.userName},{password: p, passCaducidad: new Date(inOneMonth)})

                        if (!updated) {
                            res.status(400).send({ok: false, msg:"La contraseña nueva no pudo guardarse."})
                        } else {
                            res.status(200).send({ok: true, msg:"Contraseña cambiada."})
                        }
                    } catch (err) {
                        res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
                    }                    
                }
            } else {
                res.status(400).send({ok: false, msg: "Usuario o Constraseña no Válidos"})
            }
        }
    } catch (err) {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
    }
}

async function changeState(req, res){
    let id = req.params.id

    try {
        const usuario = await Usuario.findOne({_id: id})
        if (!usuario) {
            res.status(400).send({ok: false, msg:"Usuario no encontrado."})
        } else {
            try {
                var newState = !usuario.activo
                var currState = (newState == true ? 'ACTIVO' : 'INACTIVO')

                const updated = await Usuario.findOneAndUpdate({_id: id},{activo: newState})

                if (!updated) {
                    res.status(400).send({ok: false, msg:"NO se pudo cambiar el estado del usuario"})
                } else {
                    res.status(200).send({ok: true, msg:"El Usuario '" + usuario.userName + "' ahora está " + currState})
                }
            } catch (err) {
                res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
            }                    
        }
    } catch (err) {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
    }
}

async function unlockUser(req, res){
    let id = req.params.id

    try {
        const usuario = await Usuario.findOne({_id: id})
        if (!usuario) {
            res.status(400).send({ok: false, msg:"Usuario no encontrado."})
        } else {
            try {
                var locked = !usuario.bloqueado
                var currState = (locked == true ? 'BLOQUEADO' : 'DESBLOQUEADO')

                const unlocked = await Usuario.findOneAndUpdate({_id: id},{intentos: 0, bloqueado: locked})
                
                if (!unlocked) {
                    res.status(400).send({ok: false, msg:"NO se pudo cambiar el estado de bloqueo al usuario"})
                } else {
                    res.status(200).send({ok: true, msg:"El Usuario '" + usuario.userName + "' ahora está: " + currState})
                }
            } catch (err) {
                res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
            }                    
        }
    } catch (err) {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
    }
}

async function editUser(req, res){
    const id = req.params.id
    const data = req.body

    //VALIDACIÓN DE DATOS =================================================
    let errors = ''

    const validateNames = validarNombre(data.primerNombre, data.segundoNombre, data.primerApellido, data.segundoApellido)
    if(validateNames != "" && validateNames != null){
        errors += validateNames  
    }

    if(errors != ''){
        res.status(400).send({ok: false, msg: errors})
        return
    }
    //=============================================================================

    let seguir = true
    let pasadas = 0 //Cantidad de veces que se debe pasar para armar el userName si está repetido
    let userName = ""
    while (seguir) { // Construir el userName a partir de las iniciales y el apellido
        userName = createUserName(
            data.primerNombre, 
            data.segundoNombre,
            data.primerApellido, 
            pasadas
        )

        const prevUserName = await Usuario.findOne({"userName": userName})
      
        if(!prevUserName){
            seguir = false
        }else{
            if(prevUserName._id != id)
                pasadas++
            else
                seguir = false
        }
    }

    try {
        let tipo = 1 // por defecto será usuaario normal
        if (data.password && data.confirmPassword) {
            const admin =  await Usuario.findOne({userName: { $regex: data.admin, $options:'i' }, "tipo": 0})
            if (admin) {

                if (bcrypt.compareSync(data.password, admin.password)) {
                    if(data.tipo == 1)
                        tipo = 0 // Si el ADMIN-GOD lo ordena, le cambiamos el tipo
                } else {
                    res.status(400).send({ok: false, msg:"Contraseña equivocada"})
                    return
                }
            } else {
                res.status(400).send({ok: false, msg:"Sólo un Administrador puede realizar ésta acción"})
                return
            }
        }

        var newValues = {
            "primerNombre": data.primerNombre,
            "segundoNombre": data.segundoNombre,
            "primerApellido": data.primerApellido,
            "segundoApellido": data.segundoApellido,
            "userName": userName,
            "email": userName + '@cel.gob.sv',
            "tipo": tipo
        }

        const updated = await Usuario.findOneAndUpdate({_id: id}, newValues)
        
        if (!updated) {
            res.status(400).send({ok: false, msg:"NO se pudo guardar los cambios del usuario"})
        } else {
            res.status(200).send({ok: true, msg:"Cambios guardados"})
        }
    } catch (err) {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
    }                    
}


const getAllUsers = (req, res)=>{
    Usuario.find({userName: { $nin: 'ADMIN' }}).sort({"userName": 1, "activo": -1})
    .then((result)=>{
        res.status(200).send({ok: true, result})
    })
    .catch((err)=>{
        res.status(500).send({ok: false, msg:"Ha ocurrido un error: " + err})
    })
}

const getUser = (req, res)=>{
    Usuario.findOne({_id: req.params.id, userName: { $nin: 'ADMIN' }})
    .then((user)=>{
        const daysLeft = Math.round((user.passCaducidad - (new Date())) / 86400000)
        const currUser = {
            primerNombre: user.primerNombre,
            segundoNombre: (user.segundoNombre ? user.segundoNombre : "-"),
            tercerNombre: (user.tercerNombre ? user.tercerNombre : "-"),
            primerApellido: user.primerApellido,
            segundoApellido: (user.segundoApellido ? user.segundoApellido : "-"),
            tercerApellido: (user.tercerApellido ? user.tercerApellido : "-"),

            userName: user.userName,
            email: user.email,
            tipo: user.tipo,
            passCaducidad: formatDate(user.passCaducidad),
            fechaCreacion: formatDate(user.fechaCreacion),
            dias: daysLeft
        }
        res.status(200).send({ok: true, user:currUser})
    })
    .catch((err)=>{
        res.status(400).send({ok: false, msg:"Ha ocurrido un error. " + err})
    })
}

const deleteUser = (req, res) =>{
    Usuario.findOneAndDelete({_id: req.params.id, userName: { $nin: 'ADMIN' }})
    .then(async (result) => {        
        res.status(200).send({ok: true, msg:"Se ha eliminado al Usuario"})
    }).catch((err) => {
        res.status(500).send({ok: false, msg:"Ha ocurrido un error al eliminar al usuario. " + err})
    })
}

module.exports = {
    register,
    login,
    profile,

    changePassword,
    resetPassword,
    changeState,
    unlockUser,
    editUser,

    getAllUsers,
    getUser,
    deleteUser,
}

//==============================================================================================================
//Cambiar formato de fecha de  < yyyy-mm-dd > AL FORMATO  < dd/mm/yyyy >  SOLO PARA OBJETOS "Date" DE JS
function formatDate(fecha){
    let dayNumber = fecha.getDate()
    let day = ( dayNumber < 10 ? '0' + dayNumber.toString() : dayNumber.toString() )

    let monthNumber = fecha.getMonth() + 1
    const month = ( monthNumber < 10 ? '0' + monthNumber.toString() : monthNumber.toString() )

    const year = fecha.getFullYear().toString()

    return day + "/" + month + "/" + year
}
//==============================================================================================================

function validarNombre(pn, sn, pa, sa){

    let errors = ''// Almacenar los errores en los nombres, si los hay
    const validateFirstName = (pn != null ? Validators.lettersOnly(pn.replace(/\s+/g,"")) : '')
    const validateSecondName = (sn != null ? Validators.lettersOnly(sn.replace(/\s+/g,"")) : '')
    const validateFirstLastname = (pa != null ? Validators.lettersOnly(pa.replace(/\s+/g,"")) : '')
    const validateSecondLastname = (sa != null ? Validators.lettersOnly(sa.replace(/\s+/g,"")) : '')

    errors += validateFirstName + validateSecondName + validateFirstLastname + validateSecondLastname

    return errors
}

function requireNombre(pn, sn, pa, sa){

    let errors = ''// Almacenar los errores en los nombres, si los hay
    if (pn == null || pn == '') {
        errors += 'Primer Nombre, '
    }
    if (sn == null || sn == '') {
        errors += 'Segundo Nombre, '
    }
    if (pa == null || pa == '') {
        errors += 'Primer Apellido, '
    }
    if (sa == null || sa == '') {
        errors += 'Segundo Apellido'
    }

    errors += ' es Obligatorio'

    return errors
}