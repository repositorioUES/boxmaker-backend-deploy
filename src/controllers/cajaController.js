

//PDF con PDFKit-------------
const PDF = require('pdfkit-construct')
const fs = require('fs')
const ExcelJS = require('exceljs')

const path = require('path')
const imageRoot = path.join(__dirname,'../public/images')
const pdfRoot = path.join(__dirname,'../PDF/')
const tmpRoot = path.join(__dirname,'../temp/')
const xlsxRoot = path.join(__dirname,'../xlsx/')

const Caja = require('../models/cajaModel')
const Contenido = require('../models/contenidoModel')
const Comprobante = require('../models/comprobanteModel')

const getAllCajas = (req, res)=>{
    Caja.find({}).sort({numero: -1})
    .then((result)=>{
        res.status(200).send({result, msg: "Mostrando todas las cajas"})
    }).catch((err)=>{
        res.status(500).send({msg:"Ha ocurrido un error al recupear todas las cajas : " + err})
    })
}

const getCajaTemp = (req, res)=>{
    
    Caja.findOne({"codigo": req.body.codigo})
    .then((caja)=>{

        if (caja == null) {
            res.status(400).send({msg:"Caja no encontrada"})
        }else{ 
            res.status(200).send({caja:caja, msg: "Mostrando Caja: " + req.body.codigo})
        }
    })
    .catch((err)=>{
        res.status(400).send({msg:"Ha ocurrido un error. " + err})
    })
}

async function getContenidoTemp (req, res){
    
    const filePath = tmpRoot + req.params.codigo + ".json"

    const cantidad = await Contenido.countDocuments({caja: req.params.codigo})

    if(fs.existsSync(filePath)){

        const savedData = fs.readFileSync(filePath, "utf8", (err) => {
            if (err) {
                console.error('Ha ocurrido un error: ' + err)
                return
            }
        })
        const savedData_json = JSON.parse(savedData)
        
        res.status(200).send({contenido:savedData_json, cantidad, msg: "Mostrando Contenido de la Caja: " + req.params.codigo})
    }
}


const getCaja = (req, res)=>{
    Caja.findOne({codigo: req.body.codigo})
    .then((caja)=>{
        Contenido.find({caja: req.body.codigo})
        .then((contenido)=>{
            if (caja.codigo == req.body.codigo) {
                res.status(200).send({caja:caja, contenido:contenido, msg: "Mostrando Caja: " + req.body.codigo})
            } else {
                res.status(200).send({msg:"NO se encontró la caja " + req.body.codigo})
            }
        })
        .catch((err)=>{
            res.status(400).send({msg:"Ha ocurrido un error. " + err})
        })
    })
    .catch((err)=>{
        res.status(400).send({msg:"Ha ocurrido un error. " + err})
    })
}

async function createCaja (req, res){
    const data = req.body
    const { caducidad, estante, nivel, fechaCreacion, entidad } = data // todo esto debe venir vacio en la creacion
    // En la actualización ya existe

    if(!caducidad && !estante && ! nivel && !fechaCreacion && !entidad){
        if(data.descripcion != null && data.descripcion != ""){
            const values = calculateValues( await Caja.find().sort({numero:-1}).limit(8))

            const box = new Caja({
                numero: values.numero,
                codigo : values.codigo,
                descripcion : data.descripcion,
                estante : values.estante,
                nivel : values.nivel, 
                usuario: data.usuario
            })
            
            try {
                const caja = await box.save()
                if (!caja) {
                    res.status(400).send({msg:"Ha ocurrido un error, No se ha guardado la caja."})
                }else{
                    fs.writeFileSync(tmpRoot + caja.codigo + ".json", '[]')// Crar txt temporal para el contenido de la caja
                    res.status(200).send({caja: caja, msg: "Caja Creada"})
                }
            } catch (err) {
                res.status(500).send({msg: "Ha ocurrido un error: " + err})
            }
        }else{
            res.status(400).send({msg:"La descripción de la caja es obligatoria."})
        }
    } else {
        try {                 //Sólo se puede editar la Descripción
            const caja = await Caja.findOneAndUpdate({"codigo": data.codigo, "numero": data.numero}, {"descripcion": data.descripcion})
    
            if (!caja) {
                res.status(400).send({msg:"El código no corresponde a la Caja Actual: " + data.codigo})
            } else {
                res.status(200).send({caja, msg:"Cambios Guardados.", from: 'update'})
            }
        } catch (err) {
            res.status(500).send({msg:"Ha ocurrido un error: " + err})
        }
    }
}

// Calculo automático de los valores dela caja (estante, nivel, caducidad, etc.)
function calculateValues(lastBox){

    const today = new Date(Date.now())
    const newBox = {
        codigo:'AAC',
        numero: 0,
        estante: 0,
        nivel: 0
    }

    const year = today.getFullYear().toString()
    const lastTwo = year.substring(year.length - 2)

    if (lastBox.length == 0) {
        newBox.codigo =  lastTwo + '-AAC-1'
        newBox.numero = 1
        newBox.estante = 1
        newBox.nivel = 1
    } else {
        //Armar el codigo de caja con el formato ##-AAC-####
        const num = lastBox[0].numero + 1
        newBox.codigo =  lastTwo + '-AAC-' + num.toString()
        
        newBox.numero = lastBox[0].numero + 1

        let lastLvl = lastBox[0].nivel
        let cant = 0

        lastBox.forEach(box => {
            if (box.nivel == lastLvl) {
                cant++
            }
        })
        
        const extraEst = (( lastLvl == 5 && cant == 8 ) ? 1 : 0)
        newBox.estante = lastBox[0].estante + extraEst

        if (extraEst == 1){
            lastLvl = 0
        }

        const extraNiv = (cant == 8 ? 1 : 0)
        newBox.nivel  = lastLvl + extraNiv

    }

    return newBox
}

async function updateCaja (req, res){

    const data = req.body
    try {                                                                //Sólo se puede editar la Descripción
        const caja = await Caja.findOneAndUpdate({"codigo": data.codigo, "numero": data.numero}, {"descripcion": data.descripcion})

        if (!caja) {
            res.status(400).send({msg:"Caja no encontrada."})
        } else {
            res.status(200).send({caja, msg:"Cambios Guardados."})
        }
    } catch (err) {
        res.status(500).send({msg:"Ha ocurrido un error: " + err})
    }
}

async function deleteCaja(req, res){

    const codCaja = req.params.codigo

    try {
        const removed = await Caja.deleteOne({ codigo: codCaja })
        if (!removed) {
            res.status(400).send({msg:"Caja no encontrada"})
        } else {
            await Contenido.deleteMany ({ caja: codCaja }) // Borrar todo el contenido de la caja de la BD
            
            if(fs.existsSync(tmpRoot + codCaja + ".json")){
                fs.rm(tmpRoot + codCaja + ".json", () => {})// Borramos su JSON
            }

            res.status(200).send({msg:"La Caja: "+ codCaja +" ha sido eliminada"})
        }
    } catch (error) {
        res.status(500).send({msg:"Ha ocurrido un error al eliminar la caja: " + error})
    }
}

async function deleteAllCajas(req, res){

    try {
        const r = await Caja.deleteMany({})
        if (!r) {
            res.status(400).send({msg:"Error"})
        } else {
            await Contenido.deleteMany({})
            res.status(200).send({msg:"Todas las cajas borradas"})
        }
    
    } catch (error) {
        res.status(500).send(error)
    }
}

async function generatePDF(codigo){
    
    const caja = await Caja.findOne({codigo: codigo})
    const contenidos = await Contenido.find({caja: codigo})

    const doc = new PDF({bufferPages: true}) 

    let fileName = "Reporte Caja - "+ codigo + ".pdf"
    today = formatDate(new Date())
    
// Variables para el control del layout de la "tabla" de salida============================================================
    let oroginalyInitialPos = 91 //Pixeles iniciales originales para dibujar los bordes de la "tabla" 
    let originalyInitialBody = 95 //Pixeles iniciales originales para el texto de cada celda de la "tabla"
    let cellHeight = 13 //Alto de celda en pixeles

//ESTAS TAMBIEN DE DEBEN CAMBIAR EN "putHeader"=======================
    var cellWidth = 90 //Ancho de celda en pixeles
    var leftPadding = 106 // límite izquierdo para la "tabla"
    var headerFontSize = 12
    var bodyFontSize = 9
//====================================================================

    let nextRowPos = cellHeight //Pixeles de altura de cada celda de la "tabla"
    let nro = 1 // para mostrar el número de fila que se está imprimiendo
    let rowsToJump = 48 // límite de filas a imprimir para luego saltar a la siguiente página
    let jump = rowsToJump // Acumulador de los filas de cada página luego del salto
    let pageNumber = 0 // N° de página a la que saltaremos, la primera página es la 0

    let fontType = 'Helvetica'
    let fontTypeBold = 'Helvetica-Bold'
  
    //=========================================================================================================================    
    
    let yInitialPos = oroginalyInitialPos //Acumulador de Pixeles iniciales para dibujar los bordes de la "tabla" 
    let yInitialBody = originalyInitialBody //Acumuladors de Pixeles iniciales para el texto de cada celda de la "tabla"

    putHeader(doc, caja.codigo, today, caja.usuario)
  
    contenidos.forEach(cont => {
        let formatedDate = ddMMyyyy(cont.fecha.toISOString())

        console.log(formatedDate);

        let oldType = (cont.tipo).toUpperCase()
        let tipo = (oldType == 'DIARIO' ? 'D' : (oldType == 'EGRESO' ? 'E' : 'I'))
        
        doc.fontSize(bodyFontSize).font(fontType)
        doc.lineWidth(0.5)
        doc.text(nro, leftPadding, yInitialBody, {width: 40 , align: 'center', valign:'center'}).rect(leftPadding, yInitialPos, 40, cellHeight).stroke()
        doc.text(tipo, 146, yInitialBody, {width: cellWidth , align: 'center', valign:'center'}).rect(146, yInitialPos, cellWidth, cellHeight).stroke()
        doc.text(cont.clave, 236, yInitialBody, {width: cellWidth , align: 'center', valign:'center'}).rect(236, yInitialPos, cellWidth, cellHeight).stroke()
        doc.fontSize(bodyFontSize - 1)
        doc.text(formatedDate, 326, yInitialBody, {width: cellWidth , align: 'center', valign:'center'}).rect(326, yInitialPos, cellWidth, cellHeight).stroke()
        doc.fontSize(bodyFontSize)
        doc.text(cont.correlativo, 416, yInitialBody, {width: cellWidth , align: 'center', valign:'center'}).rect(416, yInitialPos, cellWidth, cellHeight).stroke()
        
        yInitialPos += nextRowPos // 15 pixeles más para dibujar la celda justo abajo
        yInitialBody += nextRowPos
        nro++
        
        if (nro >= jump) {
            doc.addPage()
            //Imprimir el header en la nueva página
            putHeader(doc, caja.codigo, today, caja.usuario)
            pageNumber++
            doc.switchToPage(pageNumber) // Nos movemos a la nueva página
            jump += rowsToJump // le sumamos el nuevo límite de filas a imprimir

            yInitialPos = oroginalyInitialPos // en la nueva página, iniciamos a imprimir desde arriba
            yInitialBody = originalyInitialBody //con los valores originales de los pixeles iniciales
        }
    })

    doc.moveDown()
    doc.fontSize(10).text('Elaborado  :  ______________________________     Recibido  :  ______________________________\n\n'+
                     '     Firma    :  ______________________________       Firma    :  ______________________________', 80 ,yInitialPos + 30)
          
    doc.pipe(fs.createWriteStream(pdfRoot + fileName))

    doc.end()
}

//ACTUALIZAR Y DEVOLVER EL PDF DE LA CAJA SELECCIONADA============================================================================

function returnPDF(req, res){
    generatePDF(req.params.codigo)

    setTimeout(()=>{
        const fileName = pdfRoot + "Reporte Caja - "+ req.params.codigo + ".pdf"

        if (fs.existsSync(fileName)) {
            
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-disposition", `attachment;filename=${fileName}`);
            res.sendFile(fileName)
            
            fs.rm(fileName, function(err){
                if(err){
                    console.log(err)
                    res.send({msg:"Ha ocurrido un error al enviar el PDF " + err})
                } 
            })
        }
    },4000)
    
}
//=================================================================================================================================


//Imprimir el header en cada página del PDF
function putHeader(doc, codigo, today, userName){
    var headerFontSize = 12
    var headerFontSize_2 = 10
    let bodyFontSize = 9
    let cellWidth = 90 //Ancho de celda en pixeles
    let leftPadding = 106 // límite izquierdo para la "tabla"
    
    let fontType = 'Helvetica'
    let fontTypeBold = 'Helvetica-Bold'

    doc.image(imageRoot + '/logo_gobierno.png', 10, 5, {fit: [75, 75], align: 'center', valign:'center'})
                                //ORIGINAL 84, 96
    doc.image(imageRoot + '/gray_bar.png', leftPadding, 76, {width: 400, height: 15, align: 'center', valign:'center'})
    doc.font(fontType).fontSize(headerFontSize)
    doc.text('Comisión Ejecutiva Hidroeléctrica del Río Lempa\nGerencia Financiera - Depto. de Contabilidad\nComprobantes de Caja:                  ' + codigo ,
    140, 15,{widht: 8000, align: 'left'})
    doc.image(imageRoot + '/logo_CEL.png', 490, 5, {fit: [100, 40], align: 'center', valign:'center'})
    doc.fontSize(headerFontSize_2).text(today + '\n' + userName, 515, 41, {width: 500})
    
    doc.font(fontType).fontSize(bodyFontSize)
    doc.text('N°', leftPadding, 80, {width: 40 , align: 'center', valign:'center'})
    doc.text('Tipo', 146, 80, {width: cellWidth , align: 'center', valign:'center'})
    doc.text('Clave', 236, 80, {width: cellWidth , align: 'center', valign:'center'})
    doc.text('Fecha', 326, 80, {width: cellWidth , align: 'center', valign:'center'})
    doc.text('N° Comprobante', 416, 80, {width: cellWidth , align: 'center', valign:'center'})
    
    doc.moveDown()
}

async function generateExcel(req, res){

    const codigo = req.params.codigo

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Caja ' + codigo)
    
    sheet.getColumn('A').width = 15
    sheet.getColumn('B').width = 15
    sheet.getColumn('C').width = 15
    sheet.getColumn('D').width = 15
    
    const caja = await Caja.findOne({codigo: codigo})
    const contenidos = await Contenido.find({caja: codigo})
    
    if(!caja){
        res.status(400).send({msg: "No se he encontrado la caja: " + codigo})
    }else{
        for (let i = 0; i < contenidos.length; i++) {
            const row = sheet.getRow(i + 1)
            row.alignment = { vertical: 'middle', horizontal: 'center' }

            row.getCell(1).value = contenidos[i].tipo
            row.getCell(2).value = contenidos[i].clave
            row.getCell(3).value = contenidos[i].fecha
            row.getCell(4).value = contenidos[i].correlativo.toString()
        }
        const fileName = xlsxRoot + codigo + '.xlsx'
        await workbook.xlsx.writeFile(fileName)
        
        res.download(fileName)
     
        fs.rm(fileName, function(err){
            if(err) console.log(err)
            else  console.log("Archivo descargado y borrado del servidor correctamente")
        })
    }
}

// LLENAR LA CAJA DE COMPROBANTES DESDE UN EXCEL==============================================================================
async function readExcel(req, res){
    const code = req.body.codigo
    const fileName = req.body.fileName

    let filePath = xlsxRoot + fileName +'.xlsx'

    if(!fs.existsSync(filePath)){
        res.status(400).send({msg:"No se ha encontrado el archivo: '" + req.body.fileName + "'. en la ruta: " + filePath})
        return
    }

    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {worksheets:'emit', dateFormats: ['DD/MM/YYYY']})

    let hoja = 0 // Bandera para solo tomar la primera hoja del libro de excel
    let estado = 2 // bandera pal mansaje de respuesta, 0-> error, 1-> comprobantes repetidos, 2-> todo OK
    let agregados = 0 // Cuantos comprobantes se ha agregado del excel a la caja
    let noExisten = 0 //Cunatos comprobantes no estan en la base y por anto no se agregaron

    for await (const worksheetReader of workbookReader) {
        
        for await (const row of worksheetReader) {
            const newCont = new Contenido({
                caja: code,
                tipo: row.getCell(1).value.toUpperCase(),
                clave: row.getCell(2).value.toUpperCase(),
                //           1 día en ms * (num de serie fecha excel - 25569 [60años])
                fecha: new Date(86400000 * (row.getCell(3).value - 25569)),
                correlativo: row.getCell(4).value
            })

            const filter = {"tipo": newCont.tipo.toUpperCase(), "clave": newCont.clave.toUpperCase(), "fecha": newCont.fecha, "correlativo": newCont.correlativo}
            const comp = await Comprobante.findOne(filter)
            const cont = await Contenido.findOne(filter)

            if (!comp) {
                noExisten++
            } else {
                if (!cont) {
                    const stored = await newCont.save()
                    if (!stored) {
                        estado = 0
                    }else{
                        agregados++
                    }
                }else{
                    estado = 1
                }
            }
        }

        hoja = 1

        if (hoja != 0) {
            break
        }
    }   

    if(estado == 0){
        res.status(500).send({msg:"Ha ocurrido un error durante el guadaro del contenido de la caja"})
    }else if (estado == 1){
        res.status(200).send({msg:"Habían Comprobantes repetidos, sólo se agregaron " + agregados.toString() + ". Comprobantes que se intentarón agregar y que no existen: " + noExisten.toString()})
    }else{
        res.status(200).send({msg: agregados.toString() + " Comprobantes Guardados en la caja:" + code})
    }
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

function ddMMyyyy(fecha){
    let fechaStr = fecha.substring(0, 10).split("-")

    return fechaStr[2] + "/" + fechaStr[1] + "/" + fechaStr[0]
}
//==============================================================================================================

module.exports = {
    getAllCajas,
    getCaja,
    getCajaTemp,
    getContenidoTemp,
    createCaja,
    updateCaja,
    deleteCaja,

    deleteAllCajas,

    generatePDF,
    returnPDF,
    generateExcel,
    readExcel,
}