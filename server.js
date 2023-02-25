// Uses the env variables if in testing mode
if (process.env.NODE_ENV !== "production") require("dotenv").config()

// Library Imports
const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const flash = require("connect-flash")
const MongoStore = require("connect-mongo")

const app = express()

// Model imports
const User = require("./Models/User")
const Product = require("./Models/Product")
const Category = require("./Models/Category")

// Route imports
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
const { catchAsync, ExpressError } = require("./utils/errorhandling")
const { Cart } = require("./utils/cart")


const dbUrl = "mongodb+srv://shopApp:Fy6OpjfLwaaEV79D@bookings.owfjo.mongodb.net/ShopApp"

// Connects to the mongo database
mongoose.connect(dbUrl)
    .then(data => {
        console.log("Connected to mongo")
    })
    .catch(err => {
        console.log("An error has occured!")
        console.log(err)
    })

const PORT = process.env.PORT || 3000
const secret = process.env.SECRET || "secret"
if (secret === "secret") console.log("NOT USING SECURE SECRET")

// This sets all the options for the session
const sessionOptions = {
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    store: MongoStore.create({
        mongoUrl: dbUrl,
        secret: secret,
        touchAfter: 24 * 60 * 60
    })
}

sessionOptions.store.on("error", function (e) {
    console.log("SESSION STORE ERROR")
    console.log(e)
})

app.engine("ejs", ejsMate)

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use("/orderupdate", express.raw({ type: "application/json" }))
// All of these exclude the /orderupdate route as it requires the raw body
// and can't be modified in any way for the verification to work
app.use(/\/((?!orderupdate).)*/, express.json())
app.use(/\/((?!orderupdate).)*/, express.urlencoded({ extended: true }))
app.use(/\/((?!orderupdate).)*/, methodOverride("_method"))
app.use(/\/((?!orderupdate).)*/, cookieParser())
app.use(/\/((?!orderupdate).)*/, session(sessionOptions))
app.use(/\/((?!orderupdate).)*/, flash())
app.use(/\/((?!orderupdate).)*/, express.static(path.join(__dirname, "public")))

// This middleware adds the user to the request for easy verification
// Also adds any info required for the templates
app.use(/\/((?!orderupdate).)*/, catchAsync(async (req, res, next) => {
    const user = await User.findById(req.session.userId)
    req.user = user || null
    // Decide whether to use the user's cart or the session cart
    const currentCart = user ? req.user.cart : (req.session.cart ? req.session.cart.cart : [])
    // Create a new cart instance
    // Requires a new instance each time as sessions can't store objects
    req.cart = new Cart((user ? user.id : null), currentCart)
    res.locals.user = user
    res.locals.url = req.originalUrl
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    res.locals.cartLength = req.cart.getCartLength()
    next()
}))

// This renders the home page of the website
app.get("/", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    const products = await Product.find({})
    res.render("homePage", { products, categories })
}))

// This renders the form to search for a product
app.get("/search", (req, res) => {
    res.render("search")
})

// This defines the route that the search form is submitted too
app.get("/searchproduct", catchAsync(async (req, res) => {
    // This extracts the search term and makes it lowercase as well as getting all the products
    let { query } = req.query
    query = query.toLowerCase()
    const products = await Product.find({})

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
    // Limits to only show the top 20 items
    res.render("searchResult", { result: result.slice(0, 20), query })
}))

// This links all the routers to the corresponding links
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


// This serves an error if the page isn't found
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404))
})

// This handles any errors that may occur on the server side and handles them
// appropriately, to prevent the server from crashing
app.use((error, req, res, next) => {
    console.log(req.originalUrl)
    if (req.originalUrl === "/register") {
        req.flash("error", error.message)
        return res.redirect("/register")
    } else if (req.originalUrl === "/products") {
        req.flash("error", error.message)
        return res.redirect("/manageproducts/new")
    }
    console.log(error)
    const { status = 500 } = error
    if (!error.message) error.message = "Oh no, Something went wrong!"
    res.status(status).render("error", { error })
})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}!`)
})