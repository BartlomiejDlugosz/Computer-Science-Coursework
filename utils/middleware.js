const { userSchema } = require("./schemas")
const { catchAsync, ExpressError } = require("./errorhandling")

module.exports.validateProduct = async (req, res, next) => {

}

module.exports.validateCategory = async (req, res, next) => {

}

module.exports.validateOrder = async (req, res, next) => {

}

module.exports.validateUser = async (req, res, next) => {
    const { error } = userSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(",")
        next(new ExpressError(msg, 400))
    }
    next()
}