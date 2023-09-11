
const Comprobante = require('../models/comprobanteModel')
const Contenido = require('../models/contenidoModel')

const Validators = require('../../validators')

const fs = require('fs')
const { copyFile } = require('fs/promises');
const { writeFile } = require('fs/promises');

const readline = require('readline')
const path = require('path')
const { file } = require('pdfkit')
const tmpRoot = path.join(__dirname, '../temp/')

const getAllConts = (req, res) => {
    const params = req.body
    Contenido.find({ caja: params.caja }).sort({ natural: 1 })
        .then((result) => {
            res.status(200).send(result)
        })
        .catch((err) => {
            res.status(500).send({ msg: "Ha ocurrido un error: " + err })
        })
}

// Guarda los comprobantes en un JSON temporal ============================================================================================
async function saveTempContent(req, res) {

    const data = req.body

    //VALIDACIÓN DE DATOS =================================================
    let errors = []// array para guardar los json de errores, si los hay

    if (data.fecha) {
        if (!data.fecha.includes('-')) {
            const validateDate = Validators.dateFormat(data.fecha)
            if (validateDate.length > 0) {
                validateDate.forEach(vd => {
                    errors.push(vd)
                })
            }
        }
    }

    if (data.clave) {
        const validateBankKey = Validators.bankKey(data.clave)
        if (validateBankKey.length > 0) {
            validateBankKey.forEach(vbk => {
                errors.push(vbk)
            })
        }
    }

    if (data.correlativo) {
        const validateNumber = Validators.numbersOnly(data.correlativo, 4, 1)
        if (validateNumber.length > 0) {
            validateNumber.forEach(vn => {
                errors.push(vn)
            })
        }
    }

    if (errors.length > 0) {
        res.status(400).send(errors)
        return
    }
    //=====================================================================

    let formatedDate = data.fecha.includes('-') ? data.fecha : formatDate(data.fecha, 0)

    try {

        // Buscar si el comprobante existe antes de mandarlo a la BD
        const filter = { tipo: { $regex: data.tipo, $options:'i' }, clave: { $regex: data.clave, $options:'i' }, fecha: formatedDate, correlativo: data.correlativo }
        const comp = await Comprobante.findOne(filter)
        const cont = await Contenido.findOne(filter)

        if (!comp) {
            res.status(400).send({ msg: "El comprobante NO EXISTE, verifique los datos." })
        } else {
            if (!cont) {
                const filePath = tmpRoot + data.caja + ".json"

                if (fs.existsSync(filePath)) {
                    const savedData = fs.readFileSync(filePath, "utf8")
                    const savedData_json = JSON.parse(savedData)
                    const { index, tipo, clave, fecha, correlativo } = data
                    
                    let json_data = ''
                    let added = false // Se agregó el comprobante?  (para definir el mensaje de respuesta)
                  
                    let consultar = canAdd(savedData_json, tipo, clave, fecha, correlativo) // Verificar si el comp no esta en el JSON
                    let add = consultar.bool // Verificar si el comp no esta en el JSON
                    const donde = consultar.i // si esta, en que indice?
                    if (index != undefined) {
                        let tempData = []

                        if (add) {// hacemos la parafernalia de insertar enmedio solo si hay un comprobante para insertar
                            for (let i = 0; i <= savedData_json.length; i++) {
                                if (i > index) {
                                    if (add) {
                                        tempData.push(data)
                                        added = true
                                        add = false
                                    } else {
                                        tempData.push(savedData_json[i - 1])
                                    }

                                } else {
                                    tempData.push(savedData_json[i])
                                }
                            }
                        } else {
                            tempData = savedData_json
                        }
                        json_data = JSON.stringify(tempData)

                    } else {
                        if (consultar.bool){
                            const tempComp = {
                                tipo,
                                clave,
                                fecha: formatedDate,
                                correlativo
                            }
                            savedData_json.push(tempComp)
                            added = true
                        }

                        json_data = JSON.stringify(savedData_json)
                    }
                    
                    fs.writeFile(filePath, json_data, 'utf-8', (err) => {
                        if (err) {
                            res.status(400).send({ msg: "Ha ocurrido un error en el guardado temporal: " + err })
                            return
                        }
                    })
        
                    if (added)
                        res.status(200).send({ msg: "Comprobante agregado a la caja: " + data.caja })
                    else
                        res.status(400).send({ msg: "El Comprobante ya está en la Caja, en la Fila: " + (donde + 1), donde})
                } else {
                    res.status(400).send({ msg: "No existe el guardado temporal"})
                }
            } else {
                res.status(400).send({ msg: "El comprobante YA ESTÁ GUARDADO EN LA BASE DE DATOS, EN LA CAJA: " + cont.caja})
            }
        }
    } catch (err) {
        res.status(500).send({ msg: "Ha ocurrido un error: " + err })
    }
}

//==================================================================================================================
// SABER SI SE PUEDE AGREGAR EL COMPROBANTE, SOLO SI NO ESTÁ YA AGREGADO
function canAdd(data, tipo, clave, fecha, correlativo) {
    console.log('data');
    console.log(data);
    for (let i = 0; i < data.length; i++) {
        console.log(tipo + ' ' + clave + ' ' + fecha + ' ' + correlativo);

        if (tipo == data[i].tipo && clave == data[i].clave && fecha == data[i].fecha && correlativo == data[i].correlativo) {
            console.log('este es');
            return {bool: false, i}
        }
    }
    return {bool:true, i:-1}
}
//==================================================================================================================


// Guarda los comprobantes en un JSON temporal ============================================================================================
async function saveQuedan(req, res) {

    const data = req.body
    const filePath = tmpRoot + data.caja + ".json"

    try {
        if (fs.existsSync(filePath)) {
            const savedData = fs.readFileSync(filePath, "utf8")
            const savedData_json = JSON.parse(savedData)
            let agregados = 0 // Cantidad de comprobantes que se agregaron
            let existentes = 0 // Cantidad de comprobantes que se quieren agregar PERO ya estan en otra caja
            for( let i = 0; i < data.comprobantes.length; i++) {
                const { tipo, clave, fecha, correlativo } = data.comprobantes[i]
                let add = canAdd(savedData_json, tipo, clave, fecha.substring(0,10), correlativo).bool // Verificar si el comp no esta en el JSON
                console.log(add);
                const toAdd = {
                    tipo,
                    clave,
                    fecha: fecha.substring(0,10),
                    correlativo
                }

                const filter = { "tipo": { $regex: tipo, $options:'i' }, "clave": { $regex: clave, $options:'i' }, "fecha": fecha.substring(0,10), "correlativo": correlativo }
                const cont = await Contenido.findOne(filter)

                if (!cont) {
                    if (add) {
                        savedData_json.push(toAdd)
                        agregados++
                    }
                } else {
                    existentes++
                }
            }

            const json_data = JSON.stringify(savedData_json)

            fs.writeFileSync(filePath, json_data, 'utf-8', (err) => {
                if (err) {
                    res.status(400).send({ msg: "Ha ocurrido un error en el guardado temporal: " + err })
                    return
                }
            })
            let msg = agregados.toString() + " Comprobantes Trasladados a la Caja: " + data.caja
            if(existentes > 0)
                msg = "Sólo se agregaron " + agregados.toString() + " Comprobantes, '" + existentes.toString() + "' ya existen en otras Cajas." 

            res.status(200).send({ msg })
        }
    } catch (err) {
        res.status(500).send({ msg: "Ha ocurrido un error: " + err })
    }
}


async function saveContent(req, res) {
    const param = req.params

    try {
        const filePath = tmpRoot + param.codigo + '.json' // Ruta y nombre (código de la caja) del JSON
        let guardados = []

        // leer del JSON los valores para ingresarlos
        if (fs.existsSync(filePath)) {
            await Contenido.deleteMany({ "caja": param.codigo })

            const json = JSON.parse(fs.readFileSync(filePath, "utf8"))

            for (let i = 0; i < json.length; i++) {

                const newCont = new Contenido({
                    caja: param.codigo,
                    tipo: json[i].tipo,
                    clave: json[i].clave,
                    fecha: json[i].fecha.substring(0, 10),
                    correlativo: json[i].correlativo
                })

                const filter = { "tipo": { $regex: newCont.tipo, $options:'i' }, "clave": { $regex: newCont.clave, $options:'i' }, "fecha": new Date(newCont.fecha), "correlativo": newCont.correlativo }
                const cont = await Contenido.findOne(filter)//Si el contenido ya está en la caja, no se guarda

                if (!cont) {
                    await newCont.save()
                    guardados.push(json[i])
                }
            }

            const json_data = JSON.stringify(guardados)
            let writer = fs.createWriteStream(filePath, 'utf-8') 

            writer.write(json_data)
            writer.close()
        }
        res.status(200).send({ msg: "Comprobantes Guardados en la caja: "+ param.codigo})
    } catch (err) {
        res.status(500).send({ msg: "Ha ocurrido un error: " + err })
    }
}


//===================================================================================
function removeOne(req, res) {
    const data = req.body

    const filePath = tmpRoot + data.caja + ".json"
    let savedData_json = JSON.parse(fs.readFileSync(filePath, "utf8"))

    try {
        if (fs.existsSync(filePath)) {
            let tempArray  = []

            for (let i = 0; i < savedData_json.length; i++) {
                if( data.index != i)
                    tempArray.push(savedData_json[i])
            }

            const json_data = JSON.stringify(tempArray)
            let writer = fs.createWriteStream(filePath, 'utf-8') 

            writer.write(json_data)
            writer.close()

            res.status(200).send({ msg: "Comprobante removido de la caja: " + data.caja })

        }
    } catch (err) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(500).send({ msg: "Ha ocurrido un error (Guardado temporal): " + err })
    }
}
//===================================================================================

//===================================================================================
function removeAll(req, res) {
    const data = req.params

    const filePath = tmpRoot + data.codigo + ".json"

    try {
        if (fs.existsSync(filePath)) {
            fs.writeFile(filePath, '[]', 'utf-8', (err) => {
                if (err) {
                    res.status(400).send({ msg: "Ha ocurrido un error en el guardado temporal: " + err })
                    return
                }
            })
            res.status(200).send({ msg: "Se ha borrado todo el contenido de la caja: " + data.codigo })
        }
    } catch (err) {
        res.status(500).send({ msg: "Ha ocurrido un error (Guardado temporal): " + err })
    }
}
//===================================================================================



async function deleteOneCont(req, res) {

    const id = req.params.id

    try {
        const r = await Contenido.deleteOne({ _id: id })
        if (r.deletedCount == 0) {
            res.status(400).send({ msg: "Comprobante no existe o ya fue borrado." })
        } else {
            res.status(200).send({ msg: "El comprobante ha sido borrado de la caja" })
        }
    } catch (error) {
        res.status(500).send({ msg: "Ha ocurrido un error: " + error })
    }
}

//==============================================================================================================
function formatDate(fecha, version) {
    if (version == 0) {
        //Cambiar formato de fecha de  < dd/mm/yyyy >  AL FORMATO < yyyy-mm-dd >
        const v = fecha.split("/")

        return v[2] + "-" + v[1] + "-" + v[0]
    } else {
        //Cambiar formato de fecha de  < yyyy-mm-dd > AL FORMATO  < dd/mm/yyyy >
        const dayNumber = fecha.getDate()
        const day = (dayNumber < 10 ? '0' + dayNumber.toString() : dayNumber.toString())

        let monthNumber = fecha.getMonth() + 1
        const month = (monthNumber < 10 ? '0' + monthNumber.toString() : monthNumber.toString())

        const year = fecha.getFullYear().toString()

        return day + "/" + month + "/" + year
    }
}
//==============================================================================================================


module.exports = {
    getAllConts,
    saveTempContent,
    saveQuedan,
    saveContent,
    removeOne,
    removeAll,
    deleteOneCont
}