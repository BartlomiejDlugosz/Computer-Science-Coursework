const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const methodOverride = require("method-override")
const app = express()

const User = require("./Models/User")
const Order = require("./Models/Order")
const Product = require("./Models/Product")
const Category = require("./Models/Category")

mongoose.connect("mongodb+srv://shopApp:Fy6OpjfLwaaEV79D@bookings.owfjo.mongodb.net/ShopApp")
    .then(data => {
        console.log("Connected to mongo")
    })
    .catch(err => {
        console.log("An error has occured!")
        console.log(err)
    })

const PORT = process.env.PORT || 3000


app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride("_method"))

app.use(express.static(path.join(__dirname, "public")))


app.get("/", async (req, res) => {
    const categories = await Category.find({})
    const products = await Product.find({})
    res.render("homePage", { products, categories })
})

app.get("/menu", (req, res) => {
    res.render("menu")
})


app.post("/getProductInfo", async (req, res) => {
    const products = req.body
    let newArray = []
    for (let product of products) {
        let found = await Product.findById(product.id)
        newArray.push({ product: found, qty: product.qty })
    }
    res.send(newArray)
})


app.get("/cart", (req, res) => {
    res.render("cart")
})

app.post("/createOrder", async (req, res) => {
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
})




app.get("/products", async (req, res) => {
    const products = await Product.find({})
    res.render("products", { products, title: "All Products" })
})

app.post("/products", async (req, res) => {
    const { name, price, description, images, discount, discountedPrice, categories, tags, stock } = req.body
    const newProduct = new Product({ name, price, description, images, discount, discountedPrice, categories, tags, stock })
    const saved = await newProduct.save()
    res.redirect("/manageproducts/all")
})

app.patch("/products/:id", async (req, res) => {
    const { id } = req.params
    const { name, price, description, images, discount, discountedPrice, categories, tags, stock } = req.body
    const product = await Product.findByIdAndUpdate(id, { name, price, description, images, discount, discountedPrice, categories, tags, stock }, { runValidators: true, new: true })
    console.log(product)
    res.redirect("/manageproducts/all")
})

app.delete("/products/:id", async (req, res) => {
    const { id } = req.params
    const product = await Product.findByIdAndDelete(id)
    res.redirect("/manageproducts/all")
})




app.get("/categories", async (req, res) => {
    const categories = await Category.find({})
    res.render("categories", { categories })
})

app.post("/categories", async (req, res) => {
    const { name, description } = req.body
    const newCategory = new Category({ name, description })
    await newCategory.save()
    res.redirect("/categories")
})

app.get("/categories/:id", async (req, res) => {
    const { id } = req.params
    const category = await Category.findById(id)
    const products = await Product.find({ categories: id })
    res.render("products", { products, title: `${category.name}` })
})




app.get("/manageproducts/all", async (req, res) => {
    const products = await Product.find({})
    res.render("manageproducts/all", { products })
})

app.get("/manageproducts/new", async (req, res) => {
    const categories = await Category.find({})
    res.render("manageproducts/new", { categories })
})

app.get("/manageproducts/:id", async (req, res) => {
    const { id } = req.params
    const categories = await Category.find({})
    const product = await Product.findById(id).populate("categories")
    console.log(product)
    res.render("manageproducts/product", { product, categories })
})




app.get("/manageorders/all", async (req, res) => {
    const { status } = req.query
    let orders
    console.log(status)
    if (status) {
        orders = await Order.find({ status }).sort({ date: 1 })
    } else {
        orders = await Order.find({}).sort({ date: 1 })
    }

    res.render("manageorders/all", { orders })
})

app.get("/manageorders/:id", async (req, res) => {
    const { id } = req.params
    console.log(id)
    const order = await Order.findById(id).populate("userId").populate("productIds.id")
    console.log(order)
    res.render("manageorders/order", { order })
})

app.put("/manageorders/updatestatus/:id", async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    const order = await Order.findById(id)
    order.status = status
    await order.save()
    res.redirect(`/manageorders/${id}`)
})

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}!`)
})