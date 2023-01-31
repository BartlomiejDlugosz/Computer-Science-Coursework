const { userSchema, productSchema, categorySchema } = require("./schemas")
const { ExpressError } = require("./errorhandling")

// This validates the body, ensuring it meets the format defined by the schema
// Also removes any other unnecessary information
module.exports.validateProduct = (req, res, next) => {
    // Checks to see if the categories are in an array, if not then it creates an array
    req.body.product.discount = req.body.product.discount ? true : false
    if (!Array.isArray(req.body.product.categories)) req.body.product.categories = Array.of(req.body.product.categories)
    const { error } = productSchema.validate(req.body)
    if (error) {
        // Returns error if incorrect information supplied
        const msg = error.details.map(el => el.message).join(",")
        next(new ExpressError(msg, 400))
    }
    next()
}

module.exports.validateCategory = (req, res, next) => {
    const { error } = categorySchema.validate(req.body)
    if (error) {
        // Returns error if incorrect information supplied
        const msg = error.details.map(el => el.message).join(",")
        next(new ExpressError(msg, 400))
    }
    next()
}

module.exports.validateOrder = (req, res, next) => {

}

// This validates the body, ensuring it meets the format defined by the schema
// Also removes any other unnecessary information
module.exports.validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body)
    if (error) {
        // Returns error if incorrect information supplied
        const msg = error.details.map(el => el.message).join(",")
        next(new ExpressError(msg, 400))
    }
    next()
}

// Checks to see if the current user is logged in
module.exports.isLoggedIn = (req, res, next) => {
    // If there's a flash to ignore auth, it redirect to the home page
    if (req.flash("ignoreAuth")[0]) return res.redirect("/")
    if (req.user) {
        return next()
    }
    // Redirects to login if user is not logged in
    req.flash("error", "You have to be logged first!")
    res.redirect("/login")
}

// Checks to see if the current user is a staff member (defined by permLvl >= 2)
module.exports.isStaff = (req, res, next) => {
    if (req.user.permLvl >= 2) {
        return next()
    }
    // Flash error if not staff
    req.flash("error", "You are not authorized to do that!")
    res.redirect("/")
}

// Checks to see if the current user is the owner (defined by permLvl >= 3)
module.exports.isOwner = (req, res, next) => {
    if (req.user.permLvl >= 3) {
        return next()
    }
    // Flash error if not owner
    req.flash("error", "You are not authorized to do that!")
    res.redirect("/")
}

// Saves the previous url the user visited
module.exports.savePreviousUrl = (req, res, next) => {
    if (req.headers.referer) {
        if (!req.headers.referer.includes("login") && !req.headers.referer.includes("register")) {
            req.session.previousUrl = req.headers.referer
        }
    } else {
        req.session.previousUrl = "/"
    }
    next()
}

// Checks to see if the user isn't logged in
module.exports.notLoggedIn = (req, res, next) => {
    if (req.user) {
        req.flash("error", "You are already logged in!")
        return res.redirect(req.session.previousUrl || "/")
    }
    next()
}