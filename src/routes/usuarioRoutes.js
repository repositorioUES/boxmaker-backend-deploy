
const express = require('express')
const router = express.Router()

const userController = require('../controllers/usuarioController')
const initController = require('../controllers/initController')

const tokenMW = require('../middlewares/verifyUserToken')
const permissionsMW = require('../middlewares/verifyPermissions')
const passwordMW = require('../middlewares/verifyPasswordExpiration')

router.post('/register', tokenMW.hasToken, passwordMW.expiration, userController.register)

router.post('/login', userController.login)

router.get('/profile', tokenMW.hasToken, userController.profile)

router.get('/all', tokenMW.hasToken, permissionsMW.authorized,passwordMW.expiration, userController.getAllUsers)

router.get('/one/:id',tokenMW.hasToken, permissionsMW.authorized, passwordMW.expiration, userController.getUser)

// Que el propio usuario pueda cambiar su contraseña
router.post('/changePassword', tokenMW.hasToken, userController.changePassword)

//Solo el ADMIN-GOD puede resetear las contraseñas sin saber la actual
router.get('/resetPassword/:id', tokenMW.hasToken, permissionsMW.authorized, passwordMW.expiration, userController.resetPassword)

router.get('/changeState/:id', tokenMW.hasToken, permissionsMW.authorized, passwordMW.expiration, userController.changeState)

router.get('/unlock/:id', tokenMW.hasToken, permissionsMW.authorized, passwordMW.expiration, userController.unlockUser)

router.put('/edit/:id', tokenMW.hasToken, passwordMW.expiration, userController.editUser) // Editar tu propio usuario

router.delete('/delete/:id',tokenMW.hasToken, permissionsMW.authorized, passwordMW.expiration, userController.deleteUser)

//Ruta solo pa crear al ADMIN'GOD si no lo hay
router.get('/init', initController.createAdmin)

module.exports = router