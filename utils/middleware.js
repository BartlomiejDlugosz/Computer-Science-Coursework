const { presenceCheck, dataTypeCheck, maxLengthCheck, minLengthCheck, min, max, emailCheck } = require("./validation")

// This validates all the product information passed through in the body
module.exports.validateProduct = (req, res, next) => {
    const { product } = req.body
    presenceCheck(product, "Missing 'Product' object")
    product.discount = product.discount ? true : false

    // Checks to see if the categories are in an array, if not then it creates an array
    if (!Array.isArray(product.categories)) product.categories = Array.of(product.categories)

    presenceCheck(product.name, "Can't leave name empty")
    dataTypeCheck(product.name, "string", "Name must be a string")

    presenceCheck(product.price, "Can't leave price empty")
    dataTypeCheck(product.price, "number", "Price must be a number")
    min(product.price, 0, "Price must be greater than 0")
    console.log(product)
    dataTypeCheck(product.briefDescription, "string", "Brief Description must be a string", true)

    dataTypeCheck(product.description, "string", "Description must be a string", true)

    dataTypeCheck(product.discount, "boolean", "Discount must be a boolean", true)

    if (product.discount) presenceCheck(product.discountedPrice, "Can't leave discounted price empty")
    dataTypeCheck(product.discountedPrice, "number", "Discounted price must be a number", true)
    min(product.discountedPrice, 0, "Discounted price must be greater than 0", true)

    dataTypeCheck(product.categories, "array", "Categories must be an array", true)

    dataTypeCheck(product.stock, "number", "Stock must be a number", true)
    min(product.stock, 0, "Stock must be greater than 0", true)

    next()
}

// This validates all the category information passed through in the body
module.exports.validateCategory = (req, res, next) => {
    const { category } = req.body
    presenceCheck(category, "Missing 'Category' object")

    presenceCheck(category.name, "Can't leave name empty")
    dataTypeCheck(category.name, "string", "Category name must be a string")

    presenceCheck(category.description, "Can't leave description empty")
    dataTypeCheck(category.description, "string", "Category description must be a string")

    next()
}

// This validates all the user information passed through in the body
module.exports.validateUser = (req, res, next) => {
    const { user } = req.body
    presenceCheck(user, "Missing 'User' object")

    presenceCheck(user.name, "Can't leave name empty")
    dataTypeCheck(user.name, "string", "Name has to be a string")
    maxLengthCheck(user.name, 20, "Name has to be less than 20 characters long")

    presenceCheck(user.email, "Can't leave email empty")
    dataTypeCheck(user.email, "string", "Email has to be a string")
    emailCheck(user.email, "Please provide a valid email")

    presenceCheck(user.password, "Can't leave password empty")
    dataTypeCheck(user.password, "string", "Password must be a string")
    minLengthCheck(user.password, 6, "Password must be longer than 6 characters")

    dataTypeCheck(user.phone, "string", "Phone must be a string", true)

    next()
}

// Checks to see if the current user is logged in
module.exports.isLoggedIn = (req, res, next) => {
    // If there's a flash to ignore auth, it redirects to the home page
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