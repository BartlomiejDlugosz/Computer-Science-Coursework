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

module.exports.isLoggedIn = (req, res, next) => {
    if (req.user) {
        return next()
    }
    req.session.previousUrl = req.originalUrl
    req.flash("error", "You have to be logged first!")
    res.redirect("/login")
}

module.exports.isStaff = (req, res, next) => {
    if (req.user.permLvl >= 2) {
        return next()
    }
    req.flash("error", "You are not authorized to do that!")
    res.redirect("/")
}