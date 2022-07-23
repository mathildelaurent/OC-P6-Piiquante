const passwordValidator = require('password-validator');

const passwordSchema = new passwordValidator();

passwordSchema
.is().min(6)                                    
.is().max(10)                                  
.has().uppercase()                              
.has().lowercase()                              
.has().digits(2)                                
.has().not().spaces()                           
.is().not().oneOf(['Passw0rd', 'Password123']);

module.exports = (req, res, next) => {
    if(passwordSchema.validate(req.body.password)) {
        next()
    }else{
        return res.status(400).json({error: "Le mot de passe n'est pas assez fort : " + passwordSchema.validate(req.body.password)});
    }
}