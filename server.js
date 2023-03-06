// Uses the env variables if in testing mode, these contain sensitive information
if (process.env.NODE_ENV !== "production") require("dotenv").config()

// Library Imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the mongoose library which is responsible for connecting to the database
const mongoose = require("mongoose")
// Contains the path library which is used for defining file routes relative to the current directory
const path = require("path")
// Contains the methodOverride library which responsible for converting some get requests to patch and delete requests
const methodOverride = require("method-override")
// Contains the ejsMate library which is used for rendering HTML templates
const ejsMate = require("ejs-mate")
// Contains the cookie parser library which parses cookies passed through in the request
const cookieParser = require("cookie-parser")
// Contains the session library which is responsible for storing session info related to the current device
const session = require("express-session")
// Contains the flash library which is used to flash messages (Displays a message that dissapears after the page is refreshed)
const flash = require("connect-flash")
// Contains the mongo store library which connects the session to the mongo database to be used in a production environment
const MongoStore = require("connect-mongo")

// Initializes the express library and greates the app object
const app = express()

// Model imports
// Imports the user model
const User = require("./Models/User")
// Imports the product model
const Product = require("./Models/Product")
// Imports the category model
const Category = require("./Models/Category")

// Route imports
// This imports all the routes from the routes folder
const productRoutes = require("./routes/products")
const categoryRoutes = require("./routes/categories")
const manageProductsRoute = require("./routes/manageProducts")
const manageOrdersRoute = require("./routes/manageOrders")
const cartRoutes = require("./routes/cart")
const authRoutes = require("./routes/auth")
const orderRoutes = require("./routes/order")
const userRoutes = require("./routes/user")
const manageUsersRoute = require("./routes/manageUsers")
const manageCategoriesRoute = require("./routes/manageCategories")

// Function imports
// Imports the error handling functions
const { catchAsync, ExpressError } = require("./utils/errorhandling")
// Imports the cart object
const { Cart } = require("./utils/cart")

// This is the database url that mongo will connect to
const dbUrl = "MONGO_DB_LINK_REDACTED"

// Connects to the mongo database with the given url
mongoose.connect(dbUrl)
    .then(data => {
        console.log("Connected to mongo")
    })
    .catch(err => {
        // Logs any errors
        console.log("An error has occured!")
        console.log(err)
    })

// Defines the port, either use the port provided or default to 3000, this is because web hosts provide their own ports to use
const PORT = process.env.PORT || 3000
// Use the signing secret provided or default to the standard one
const secret = process.env.SECRET || "secret"
// Prints if a secure secret isn't being used
if (secret === "secret") console.log("NOT USING SECURE SECRET")

// This sets all the options for the session
const sessionOptions = {
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // Sets the expiry date of the session
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    // Makes sure the mongo database is used for storing session info instead of local memory which is prone to memory leaks etc.
    store: MongoStore.create({
        mongoUrl: dbUrl,
        secret: secret,
        touchAfter: 24 * 60 * 60
    })
}

// Logs any error that may occur with the session
sessionOptions.store.on("error", function (e) {
    console.log("SESSION STORE ERROR")
    console.log(e)
})

// Uses the ejs template renderer
app.engine("ejs", ejsMate)
// Sets the view engine to ejs so templates are rendered appropriatley
app.set("view engine", "ejs")
// Sets the views folder, this is where html templates will be searched for
app.set("views", path.join(__dirname, "views"))

// This middleware is only used on the "/orderupdate" route and it passes through the raw json which is required for verification
app.use("/orderupdate", express.raw({ type: "application/json" }))
// All of these exclude the /orderupdate route as it requires the raw body
// and can't be modified in any way for the verification to work
// This parses the body using json
app.use(/\/((?!orderupdate).)*/, express.json())
// This parses form bodys that are sent in the url
app.use(/\/((?!orderupdate).)*/, express.urlencoded({ extended: true }))
// This defines the variable that will be used for the method override (e.g. _method=DELETE will be converted to a delete request)
app.use(/\/((?!orderupdate).)*/, methodOverride("_method"))
// This uses the cookie parser to parse the cookies
app.use(/\/((?!orderupdate).)*/, cookieParser())
// This adds the session object to all the requests
app.use(/\/((?!orderupdate).)*/, session(sessionOptions))
// This adds the flash object to all the requests
app.use(/\/((?!orderupdate).)*/, flash())

// This middleware adds the user to the request for easy verification
// Also adds any info required for the templates
app.use(/\/((?!orderupdate).)*/, catchAsync(async (req, res, next) => {
    // Attempts to find the user
    const user = await User.findById(req.session.userId)
    // Sets the user on the request to either the user or null if there is no user
    req.user = user || null
    // Decide whether to use the user's cart or the session cart based on whether the user is logged in or not
    const currentCart = user ? req.user.cart : (req.session.cart ? req.session.cart.cart : [])
    // Create a new cart instance
    // Requires a new instance each time as sessions can't store objects
    req.cart = new Cart((user ? user.id : null), currentCart)
    // Adds all the information to the templates so they can render the right information
    res.locals.user = user
    res.locals.url = req.originalUrl
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    res.locals.cartLength = req.cart.getCartLength()
    next()
}))

// This renders the home page of the website
app.get("/", catchAsync(async (req, res) => {
    // Retrieves all the categories and products from the database
    const categories = await Category.find({})
    const products = await Product.find({})
    // Renders the home page with the products and categories
    // The products and categories are limited to 4 categories and 20 products to reduce clutter from the home page
    res.render("homePage", { products: products.slice(0, 20), categories: categories.slice(0, 4) })
}))

// This renders the form to search for a product
app.get("/search", (req, res) => {
    res.render("search")
})

// This defines the route that the search form is submitted too
app.get("/searchproduct", catchAsync(async (req, res) => {
    // This extracts the search term and makes it lowercase
    let { query } = req.query
    query = query.toLowerCase()
    // Gets all the products
    const products = await Product.find({})
    // This is where the results will be stored ranked from most accurate to worst
    let result = []

    // This loops through all the products and uses a scoring system to find the most relevant
    // products to the search query
    // The scoring system works as follows:
    // 1 point for any matching letter
    // length * 10 points for consecutive letters in any order
    // length * 100 points for consecutive letters in order that they appear in query
    // These are then sorted from the highest score to lowest and rendered in the form
    for (let product of products) {
        let score = 0
        let currentString = ""
        let name = product.name.toLowerCase()
        // Goes through each letter in the name of the product
        for (let i = 0; i < name.length; i++) {
            // Checks if the letter is in the query
            if (query.includes(name[i])) {
                // Adds the letter to the current string to keep track of consecutive letters
                currentString += name[i]
            } else {
                // If the letter isn't in the query then there are no more consecutive letters and
                // The score is added for this set of letters based on the above criteria
                score += currentString.length > 1 ? (query.includes(currentString) ? currentString.length * 100 : currentString.length * 10) : currentString.length
                // String is then reset
                currentString = ""
            }
        }
        // Only adds items with a score greater than 1
        if (score > 0) {
            // Adds the item to the array if empty
            if (result.length === 0) {
                result.push({ product, score })
            } else {
                // Loops through the array to see which position the item should be inserted into
                for (let i = 0; i < result.length; i++) {
                    // Inserts the item if the current item has a greater score
                    if (score > result[i].score) {
                        result.splice(i, 0, { product, score })
                        break
                    } else if (i === result.length - 1) {
                        // Adds the item to the end
                        result.push({ product, score })
                        break
                        // Prevents from adding items beyond the 20th index
                    } else if (i >= 20) break
                }
            }
        }
    }
    // Renders the results, limiting the results to 20 items
    res.render("searchResult", { result: result.slice(0, 20), query })
}))

// This uses all the routes defined in the routes file. These routes will all be prefixed with the prefix defined
app.use("/products", productRoutes)
app.use("/categories", categoryRoutes)
app.use("/manageProducts", manageProductsRoute)
app.use("/manageOrders", manageOrdersRoute)
app.use("/cart", cartRoutes)
app.use("/order", orderRoutes)
app.use("/user", userRoutes)
app.use("/manageusers", manageUsersRoute)
app.use("/managecategories", manageCategoriesRoute)
app.use("/", authRoutes)


// This catches any requests that haven't been handled by any other routes and displays a 404 error
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404))
})

// This handles any errors that may occur on the server side and handles them
// appropriately, to prevent the server from crashing
app.use((error, req, res, next) => {
    // Flashes the error if the error came from the register or products route
    if (req.originalUrl.includes("/register")) {
        req.flash("error", error.message)
        return res.redirect("/register")
    } else if (req.originalUrl.includes("/products")) {
        req.flash("error", error.message)
        return res.redirect("/manageproducts/new")
    }
    const { status = 500 } = error
    if (!error.message) error.message = "Oh no, Something went wrong!"
    res.status(status).render("error", { error })
})

// This makes the app listen on the defined port for any incoming requests
app.listen(PORT, () => {
    console.log(`Running on port ${PORT}!`)
})