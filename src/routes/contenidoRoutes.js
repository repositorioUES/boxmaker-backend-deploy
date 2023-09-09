
const express = require('express')
const router = express.Router()

const contController = require('../controllers/contenidoController')

const tokenMW = require('../middlewares/verifyUserToken')
const permissionsMW = require('../middlewares/verifyPermissions')
const passwordMW = require('../middlewares/verifyPasswordExpiration')

//PARA DESARROLLO, BORRA LUEGO==================================
router.get('/all', contController.getAllConts)

router.post('/insert',tokenMW.hasToken, passwordMW.expiration, contController.saveTempContent) // Gardado temporal del ingreso manual de comprobantes, que no tiene QUEDAN

router.post('/quedanInsert',tokenMW.hasToken, passwordMW.expiration, contController.saveQuedan) // Gardado temporal del ingreso por QUEDAN

router.get('/save/:codigo',tokenMW.hasToken, passwordMW.expiration,  contController.saveContent)//Guarda definitivamente los cmprobantes en la BD

//Borrar todo el contenido de una caja por su Código de Caja
router.delete('/deleteAll/:codigo',tokenMW.hasToken, passwordMW.expiration,  contController.removeAll)

//Borrar un solo contenido de una caja por su Id
router.delete('/deleteOne/:id',tokenMW.hasToken, passwordMW.expiration,  contController.deleteOneCont)

//Borra un contenido del JSON temporal
router.post('/removeOne',tokenMW.hasToken, passwordMW.expiration,  contController.removeOne)

module.exports = router