
const express = require('express')
const router = express.Router()

const cajaController = require('../controllers/cajaController')

const tokenMW = require('../middlewares/verifyUserToken')
const permissionsMW = require('../middlewares/verifyPermissions')
const passwordMW = require('../middlewares/verifyPasswordExpiration')

router.get('/all', tokenMW.hasToken, passwordMW.expiration, cajaController.getAllCajas)

// router.get('/one', cajaController.getCaja)

router.post('/one/', tokenMW.hasToken, passwordMW.expiration, cajaController.getCajaTemp)

router.get('/contenido/:codigo', tokenMW.hasToken, passwordMW.expiration, cajaController.getContenidoTemp)

router.post('/create', tokenMW.hasToken, passwordMW.expiration, cajaController.createCaja)

router.put('/update', tokenMW.hasToken, passwordMW.expiration, cajaController.updateCaja)

router.delete('/delete/:codigo', tokenMW.hasToken, passwordMW.expiration, permissionsMW.authorized, cajaController.deleteCaja)

router.delete('/deleteAll', tokenMW.hasToken, passwordMW.expiration, cajaController.deleteAllCajas)

router.get('/generatePDF/:codigo', /*tokenMW.hasToken, passwordMW.expiration,*/ cajaController.returnPDF)

router.get('/generateExcel/:codigo', /*tokenMW.hasToken, passwordMW.expiration,*/ cajaController.generateExcel)

router.get('/readExcel', tokenMW.hasToken, passwordMW.expiration, cajaController.readExcel)


module.exports = router