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

const User = require("./Models/User")
const Order = require("./Models/Order")
const Product = require("./Models/Product")
const Category = require("./Models/Category")

const productRoutes = require("./routes/products")
const categoryRoutes = require("./routes/categories")
const manageProductsRoute = require("./routes/manageProducts")
const manageOrdersRoute = require("./routes/manageOrders")
const cartRoutes = require("./routes/cart")
const authRoutes = require("./routes/auth")
const orderRoutes = require("./routes/order")
const userRoutes = require("./routes/user")

const { catchAsync, ExpressError } = require("./utils/errorhandling")
const { isLoggedIn } = require("./utils/middleware")


const dbUrl = "MONGO_DB_LINK_REDACTED"

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
app.use(/\/((?!orderupdate).)*/, express.json())
app.use(/\/((?!orderupdate).)*/, express.urlencoded({ extended: true }))
app.use(/\/((?!orderupdate).)*/, methodOverride("_method"))
app.use(/\/((?!orderupdate).)*/, cookieParser())
app.use(/\/((?!orderupdate).)*/, session(sessionOptions))
app.use(/\/((?!orderupdate).)*/, flash())
app.use(/\/((?!orderupdate).)*/, express.static(path.join(__dirname, "public")))

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
    if (!(req.originalUrl.includes("login") || req.originalUrl.includes("register"))) {
        req.session.previousUrl = req.originalUrl
    }
    next()
}))


app.get("/", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    const products = await Product.find({})
    res.render("homePage", { products, categories })
}))

app.get("/menu", isLoggedIn, (req, res) => {
    res.render("menu")
})


app.use("/products", productRoutes)
app.use("/categories", categoryRoutes)
app.use("/manageProducts", manageProductsRoute)
app.use("/manageOrders", manageOrdersRoute)
app.use("/cart", cartRoutes)
app.use("/order", orderRoutes)
app.use("/user", userRoutes)
app.use("/", authRoutes)


app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404))
})

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