

/* VALIDAR QUE LA CADENA SOLO CONTENGA NÚMEROS Y QUE CUMPLA CON LA LONGITUD DESEADA================================================================
    si maxLength y minLength son nulos, no los toma en cuanta
    si solo hay maxlength se toma que la longitud debe ser igual (NO menor) a maxLength    */

function numbersOnly(data, maxLength, minLength){
    const numbers = ['0','1','2','3','4','5','6','7','8','9']

    let respuesta = [] // Almacenar los json de respuesta di hay errores
    
    if(data != null){
        //Probar que sean sólo Números
        for (let i = 0; i < data.length; i++) {
            if (!numbers.includes(data[i])) {
                res = {
                    dato: data,
                    msg:"El dato enviado contiene caractéres no válidos, debe contener sólo números"
                }
                respuesta.push(res)
                break
            }
        }
        
        // Probar que cumpla con la longitud
        if(maxLength != null){
            if(minLength == null){
                if(data.length != maxLength){
                    res = {
                        dato: data,
                        longitud: data.length,
                        msg:"El dato no cumple con la cantidad de: " + maxLength + " caractéres exáctos"
                    }
                    respuesta.push(res)
                }   
            }else{
                if(data.length > maxLength && data.length < minLength){
                    res = {
                        dato: data,
                        longitud: data.length,
                        msg:"El dato no cumple con la cantidad de: " + maxLength + " caractéres máximo y " + minLength + " caractéres mínimo"
                    }
                    respuesta.push(res)
                } 
            }
        }
    }

    return respuesta 
}
//==================================================================================================================================================

/* VALIDAR QUE LA CADENA SOLO CONTENGA LETRAS Y QUE CUMPLA CON LA LONGITUD DESEADA================================================================
    si maxLength y minLength son nulos, no los toma en cuanta
    si solo hay maxlength se toma que la longitud debe ser igual (NO menor) a maxLength    */

    function lettersOnly(data, maxLength, minLength){
        const letters = [' ','a','b','c','d','e','f','g','h','i','j','k','l','m','n','ñ','o','p','q','r','s','t','u','v','w','x','y','z','á','é','í','ó','ú']
    
        let respuesta = '' // Almacenar los string de respuesta si hay errores
        
        if(data.replace(/\s+/g,"") != null){
            //Probar que sean sólo Letras
            for (let i = 0; i < data.length; i++) {
                if (!letters.includes(data[i].toLowerCase())) {
                    respuesta += data + ' debe ser sólo Letras\n'
                    break
                }
            }
            
            // Probar que cumpla con la longitud
            if(maxLength != null){
                if(minLength == null){
                    if(data.length != maxLength){
                        respuesta += data + 'no cumple con la cantidad de: " + maxLength + " caractéres exáctos, '
                    }   
                }else{
                    if(data.length > maxLength && data.length < minLength){
                        respuesta += data + '  no cumple con la cantidad de: ' + maxLength + ' caractéres máximo y ' + minLength + ' caractéres mínimo, '
                    } 
                }
            }
        }
    
        return respuesta 
    }
    //==================================================================================================================================================

/* VALIDAR QUE LA FECHA TENGA EL FORMATO DESEADO================================================================
        d d / m m / y y y  y
        1 2 3 4 5 6 7 8 9 10
      */
function dateFormat(data){
    let respuesta = []// Almacenar los json de respuesta di hay errores

    const day = data.substring(0, 2)
    let testDay = numbersOnly(day, 2)
    
    const month = data.substring(3, 5)
    let testMonth = numbersOnly(month, 2)

    const year = data.substring(6, 10)
    let testYear = numbersOnly(year, 4)

    if(parseInt(month) > 12 || parseInt(month) < 1){
        res = {
            dato: 'Fecha',
            Mes: month,
            msg:"El Mes no puede ser mayor que 12 ni menor que 1"
        }
        respuesta.push(res)
    }

    const daysOfMonth = new Date(year, month, 0).getDate()

    if(day > daysOfMonth){
        res = {
            dato: 'Fecha',
            Valor: data,
            Dia: day,
            msg:"El Día no puede ser mayor que " + daysOfMonth.toString()
        }
        respuesta.push(res)
    }

    // dia sean 2 núumeros     mas sean 2 números      año sean 4 números
    if(testDay.length != 0 || testMonth.length != 0 || testYear.length != 0){
        res = {
            dato: 'Fecha',
            fecha: data,
            msg:"La fecha no cumple con el formato 'dd/mm/yyyy' --> ejemplo: 01/05/2021"
        }
        respuesta.push(res)
    }else{
        //Que la fecha no sea mayor que la de hoy
        const today = new Date()
        let date = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10))

        if(today < date){
            res = {
                dato: 'Fecha',
                fecha: data,
                hoy: today,
                msg:"La fecha enviada es mayor a la fecha actual"
            }
            respuesta.push(res)
        }
    }

    return respuesta
}
//================================================================================================================================================


function bankKey(data){
    let respuesta = []// Almacenar los json de respuesta di hay errores

    if(data.length != 2){
        res = {
            dato: 'Clave',
            valor: data,
            longitud: data.length,
            msg:"La clave no cumple con la cantidad de 2 caractéres exáctos"
        }
        respuesta.push(res)
    }

    let firstChar = lettersOnly(data[0])
    if(firstChar.length > 0){
        res = {
            dato: 'Clave',
            valor: data,
            caracter: data[0],
            msg:"El primer caratér de la clave debe ser una letra"
        }
        respuesta.push(res)
    }

    if(lettersOnly(data[1]).length > 0 && numbersOnly(data[1]).length > 0){
        res = {
            dato: 'Clave',
            valor: data,
            caracter: data[1],
            msg:"El segindo caratér de la clave debe ser una letra o un número"
        }
        respuesta.push(res)
    }

    return respuesta
}

module.exports = {
    numbersOnly,
    lettersOnly,
    dateFormat,
    bankKey,

}