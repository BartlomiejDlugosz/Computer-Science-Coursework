const Joi = require("joi")

module.exports.userSchema = Joi.object({
    user: Joi.object({
        name: Joi.string().required().max(20).messages({
            "string.required": "Can't leave email empty",
            "string.max": "Name has to be less than 20 characters!"
        }),
        email: Joi.string().required().email().messages({
            "string.required": "Can't leave email empty",
            "string.email": "Please enter a valid email address"
        }),
        password: Joi.string().required().min(6).messages({
            "string.min": "Password has to be at least 6 characters long!",
            "string.required": "Can't leave password empty"
        }),
        phone: Joi.string().optional().default("").allow(""),
        address: Joi.string().optional().default("").allow("")
    })
})