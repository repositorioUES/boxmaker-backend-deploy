

function enUnMes (){
    //Sumar 31 días a partir de hoy para la fecha ce caducidad del password
    let hoy = new Date()
    let inOneMonth = hoy.setDate(hoy.getDate() + 31)

    return inOneMonth
}

module.exports = { enUnMes }