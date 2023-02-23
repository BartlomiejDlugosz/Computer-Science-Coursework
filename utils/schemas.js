const Joi = require("joi")

// This defines the user schema so that it can verify incomming information
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
    }).required()
})

// This defines the product schema so that it can verify incomming information
module.exports.productSchema = Joi.object({
    product: Joi.object({
        name: Joi.string().required().messages({
            "string.required": "Can't leave name empty"
        }),
        price: Joi.number().min(0).required().messages({
            "number.required": "Can't leave price empty",
            "number.min": "Price has to be greater than 0!"
        }),
        description: Joi.string().optional().allow(""),
        discount: Joi.boolean().default(false).optional(),
        discountedPrice: Joi.number().min(0).default(0).optional().allow("").messages({
            "number.min": "Discounted price has to be greater than 0!"
        }),
        categories: Joi.array().optional(),
        stock: Joi.number().min(0).default(0).optional().messages({
            "number.min": "Stock has to be greater than 0!"
        })
    }).required()
})

// This defines the category schema so that it can verify incoming information
module.exports.categorySchema = Joi.object({
    category: Joi.object({
        name: Joi.string().required().messages({
            "string.required": "Can't leave name empty"
        }),
        description: Joi.string().required().messages({
            "string.required": "Can't leave description empty"
        })
    }).required()
})