
const express = require('express')
const router = express.Router()

const compController = require('../controllers/comprobanteController')

const tokenMW = require('../middlewares/verifyUserToken')
const permissionsMW = require('../middlewares/verifyPermissions')
const passwordMW = require('../middlewares/verifyPasswordExpiration')

router.get('/all', tokenMW.hasToken, passwordMW.expiration, compController.getAllComps)

//Filtrados por Quedan y rango de Fecha
router.post('/filter', tokenMW.hasToken, passwordMW.expiration, compController.getComps)

//Solo pa' llenar la base uno a uno
router.post('/create', tokenMW.hasToken, passwordMW.expiration, compController.createComp)

router.get('/readExcel', tokenMW.hasToken, permissionsMW.authorized, passwordMW.expiration, compController.readExcel)


module.exports = router