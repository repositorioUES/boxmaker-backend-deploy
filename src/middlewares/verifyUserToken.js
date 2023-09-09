
const jwt = require('jsonwebtoken')

const hasToken = (req, res, next) => {
    const authorization_header = req.headers['authorization'] 
    // console.log(authorization_header)
    if (authorization_header !== undefined && authorization_header != '' && authorization_header != null) {
        //Header viene como "Bearer s651e16wedasff5651sf...." 
        // le quitamos la palabra 'Bearer' y el espacio, tomamos el 2° valor del arreglo del split()
        let tempToken = authorization_header
        if (tempToken.toString().includes(" ")){
        //     //Header viene como "Bearer s651e16wedasff5651sf...."  
            tempToken = authorization_header.split(" ")[1]  // le quitamos la palabra 'Bearer' y el espacio, tomamos el 2° valor del arreglo del split()
        }
        
        req.token = tempToken
        // console.log(tempToken)
        
        jwt.verify(tempToken, process.env.SECRET_KEY, async (err, userData)=>{
            if (err) {
                res.status(500).send({msg:"Ha ocurrido un error: " + err})
            } else {
                req.loggedUserName = userData.user.userName
                req.loggedUserId = userData.user._id
                next()
            }
        })
    } else {
        res.status(300).send({msg:"NO está autorizado para ver ésta página"})
    }
}

exports.hasToken = hasToken