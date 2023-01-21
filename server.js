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
const ownerRoutes = require("./routes/owner")

const { catchAsync, ExpressError } = require("./utils/errorhandling")


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
    req.session.cart = req.session.cart || []
    const user = await User.findById(req.session.userId) || null
    req.user = user
    res.locals.user = user
    res.locals.url = req.originalUrl
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    const cart = user ? user.cart : req.session.cart
    const cartLength = cart.reduce((prev, current) => prev + current.qty, 0)
    res.locals.cartLength = cartLength
    next()
}))

// This renders the home page of the website
app.get("/", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    const products = await Product.find({})
    res.render("homePage", { products, categories })
}))

// This links all the routers to the corresponding links
app.use("/products", productRoutes)
app.use("/categories", categoryRoutes)
app.use("/manageProducts", manageProductsRoute)
app.use("/manageOrders", manageOrdersRoute)
app.use("/cart", cartRoutes)
app.use("/order", orderRoutes)
app.use("/user", userRoutes)
app.use("/", ownerRoutes)
app.use("/", authRoutes)


// This serves an error if the page isn't found
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404))
})

// This handles any errors that may occur on the server side and handles them
// appropriately, to prevent the server from crashing
app.use((error, req, res, next) => {
    if (req.originalUrl === "/register") {
        req.flash("error", error.message)
        return res.redirect("/register")
    }
    const { status = 500 } = error
    if (!error.message) error.message = "Oh no, Something went wrong!"
    res.status(status).render("error", { error })
})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}!`)
})