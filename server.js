const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const flash = require("connect-flash")

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
const userRoutes = require("./routes/user")

const { catchAsync, ExpressError } = require("./utils/errorhandling")

mongoose.connect("MONGO_DB_LINK_REDACTED")
    .then(data => {
        console.log("Connected to mongo")
    })
    .catch(err => {
        console.log("An error has occured!")
        console.log(err)
    })

const PORT = process.env.PORT || 3000

const sessionOptions = {
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.engine("ejs", ejsMate)

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride("_method"))
app.use(cookieParser())
app.use(session(sessionOptions))
app.use(flash())
app.use(express.static(path.join(__dirname, "public")))

app.use(catchAsync(async (req, res, next) => {
    req.session.cart = req.session.cart || []
    const user = await User.findById(req.session.userId) || null
    req.user = user
    res.locals.user = user
    res.locals.url = req.originalUrl
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    next()
}))


app.get("/", catchAsync(async (req, res) => {
    const categories = await Category.find({})
    const products = await Product.find({})
    console.log(req.user)
    res.render("homePage", { products, categories })
}))

app.get("/menu", (req, res) => {
    res.render("menu")
})


app.post("/getProductInfo", catchAsync(async (req, res) => {
    const products = req.body
    let newArray = []
    for (let product of products) {
        let found = await Product.findById(product.id)
        newArray.push({ product: found, qty: product.qty })
    }
    res.send(newArray)
}))


app.get("/cart", catchAsync(async (req, res) => {
    let newArray = []
    for (let product of req.session.cart) {
        let found = await Product.findById(product.id)
        newArray.push({ product: found, qty: product.qty })
    }
    res.render("cart", { cart: newArray })
}))

app.post("/createOrder", catchAsync(async (req, res) => {
    const cart = req.body
    let valid = { type: true, product: null }
    let total = 0
    for (let productId of cart) {
        let product = await Product.findById(productId.id)
        if (product.stock >= productId.qty) {
            if (product.discount) {
                total += product.discountedPrice * productId.qty
            } else {
                total += product.price * productId.qty
            }
        } else {
            valid.type = false
            valid.product = product
        }
    }
    if (valid.type) {
        const user = await User.findById("63721fca71717f4e4166b46e")
        const newOrder = new Order({ userId: user.id, productIds: cart, date: Date.now(), total, address: user.address, transactionId: "0", status: 1 })
        await newOrder.save()
        user.orders.push(newOrder)
        await user.save()

        for (let productId of cart) {
            let product = await Product.findById(productId.id)
            product.stock -= productId.qty
            product.save()
        }

        res.send({ status: "Success" })
    } else {
        res.send({ status: "Out of stock", errorMessage: `The product "${valid.product.name}" is out of stock, and has been removed from the cart for you.`, product: valid.product })
    }
}))


app.use("/products", productRoutes)
app.use("/categories", categoryRoutes)
app.use("/manageProducts", manageProductsRoute)
app.use("/manageOrders", manageOrdersRoute)
app.use("/cart", cartRoutes)
app.use("/", userRoutes)

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