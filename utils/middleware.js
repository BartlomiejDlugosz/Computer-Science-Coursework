const { userSchema, productSchema, categorySchema } = require("./schemas")
const { ExpressError } = require("./errorhandling")
const {presenceCheck, dataTypeCheck, lengthCheck, min, max} = require("./validation")

// This validates the body, ensuring it meets the format defined by the schema
// Also removes any other unnecessary information
module.exports.validateProduct = (req, res, next) => {
    // Checks to see if the categories are in an array, if not then it creates an array
    const {product} = req.body
    presenceCheck(product, "Missing 'Product' object")
    product.discount = product.discount ? true : false
    if (!Array.isArray(product.categories)) product.categories = Array.of(product.categories)

    presenceCheck(product.name, "Can't leave name empty")
    dataTypeCheck(product.name, "string", "Name must be a string")
    
    presenceCheck(product.price, "Can't leave price empty")
    dataTypeCheck(product.price, "number", "Price must be a number")
    min(product.price, 0, "Price must be greater than 0")

    dataTypeCheck(product.description, "string", "Description must be a string", true)

    dataTypeCheck(product.discount, "boolean", "Discount must be a boolean", true)

    dataTypeCheck(product.discountedPrice, "number", "Discounted price must be a number", true)
    min(product.discountedPrice, 0, "Discounted price must be greater than 0")

    dataTypeCheck(product.categories, "array", "Categories must be an array", true)

    dataTypeCheck(product.stock, "number", "Stock must be a number", true)



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