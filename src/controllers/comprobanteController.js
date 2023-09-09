
const Comprobante = require('../models/comprobanteModel')
const fs = require('fs')
const ExcelJS = require('exceljs')

const path = require('path')
const readline = require('readline')
const tmpRoot = path.join(__dirname,'../temp/')
const xlsxRoot = path.join(__dirname,'../xlsx/')


const getAllComps = (req, res)=>{
    Comprobante.find({})
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        res.status(500).send({msg:"Ha ocurrido un error" + err})
    })
}

const getComps = (req, res)=>{
    const params = req.body
    
    // const fI = new Date(params.fInicio.split("/")[2], parseInt(params.fInicio.split("/")[1]) - 1, params.fInicio.split("/")[0])
    // const fF = new Date(params.fFinal.split("/")[2], parseInt(params.fFinal.split("/")[1]) - 1, params.fFinal.split("/")[0])
   
    Comprobante.find({quedan:params.quedan, $and: [{fecha: {$gte: new Date(params.fInicio + "T00:00:00.000Z")}}, {fecha: {$lte: new Date(params.fFinal + "T23:59:59.999Z")}}]})
    .sort({fecha: 1})
    .then((result)=>{
        res.status(200).send(result)
    }).catch((err)=>{

        res.status(500).send({msg:"Ha ocurrido un error" + err})
    })
}

async function createComp (req, res){
    const data = req.body

    let formatedDate = formatDate(data.fecha)
    const comp = new Comprobante({
        quedan: data.quedan,
        tipo: data.tipo,
        clave: data.clave,
        fecha: formatedDate,
        correlativo: data.correlativo
    })
    
    try {
        const stored = await comp.save()
        if (!stored) {
            res.status(400).send({msg:"Ha ocurrido un error, No se ha guardado el comprobante."})
        }else{
            res.status(200).send({msg:"Comprobante guardado."})
        }
    } catch (err) {
        res.status(500).send({msg:"Ha ocurrido un error: " + err})
    }
}

// LLENAR LA "TABLA" DE COMPROBANTES DESDE UN EXCEL==============================================================================
async function readExcel(req, res){
    let fileName = xlsxRoot + req.body.fileName +'.xlsx'

    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(fileName, {worksheets:'emit', dateFormats: ['DD/MM/YYYY']})

    let hoja = 0 // Solo tomaremos la primera hoja del libro de excel
    let estado = 2 // bandera pal mansaje de respuesta, 0 -> error, 1 -> comprobantes repetidos, 2 -> todo OK
    let agregados = 0
    for await (const worksheetReader of workbookReader) {
        
        for await (const row of worksheetReader) {
            const newComp = new Comprobante({
                quedan: (row.getCell(1).value == null ? "" : row.getCell(1).value ),
                tipo: row.getCell(2).value,
                clave: row.getCell(3).value,
                //           1 día en ms * (num de serie fecha excel - 25569 [60años])
                fecha: new Date(86400000 * (row.getCell(4).value - 25569)),
                correlativo: row.getCell(5).value
            })

            const filter = {"quedan":newComp.quedan, "tipo": newComp.tipo, "clave": newComp.clave, "fecha": newComp.fecha, "correlativo": newComp.correlativo}
            const comp = await Comprobante.findOne(filter)

            if (!comp) {
                const stored = await newComp.save()
                if (!stored) {
                    estado = 0
                }else{
                    agregados++
                }
            }else{
                estado = 1
            }
        }

        hoja = 1

        if (hoja != 0) {
            break
        }
    }   

    if(estado == 0){
        res.status(500).send({msg:"Ha ocurrido un error durante el guadaro"})
    }else if (estado == 1){
        res.status(200).send({msg:"Habían Comprobantes repetidos, sólo se agregaron " + agregados.toString()})
    }else{
        res.status(200).send({msg: agregados.toString() + " Comprobantes Guardados en la Base"})
    }
}


//==============================================================================================================
//Cambiar formato de fecha de  < dd/mm/yyyy > o < dd-mm-yyyy >  AL FORMATO < yyyy-mm-dd >
function formatDate(fecha){
    // console.log(fecha)
    const v = fecha.toString().split("/")
    // console.log(v[2] + "-" + v[1] + "-" + v[0])

    return v[2] + "-" + v[1] + "-" + v[0]
}
//==============================================================================================================

module.exports = {
    getAllComps,
    getComps,
    createComp,
    readExcel,
}