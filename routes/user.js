const express = require("express")
const router = express.Router()

const stripe = require('stripe')('sk_test_51Klf4uDwkLbs7UhvgbC57fRb7nIeEBOALxPj2tVqkflB1eh3g9fekCGvOloPBBepqtwmOx7tfOjLpzow0KIin0ck00ePvuSr3S')

const bcrypt = require("bcrypt")
const User = require("../Models/User")
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { validateUser, isLoggedIn } = require("../utils/middleware")
const Product = require("../Models/Product")

router.get("/login", (req, res) => {
    res.render("user/login")
})
router.get("/register", (req, res) => {
    res.render("user/register")
})

router.post("/login", catchAsync(async (req, res) => {
    const { user: u } = req.body
    const user = await User.findOne({ email: u.email })
    if (user) {
        if (await bcrypt.compare(u.password, user.password)) {
            req.session.userId = user.id
            req.flash("success", "Successfully logged in!")
            return res.redirect(req.session.previousUrl || "/")
        }
    }
    req.flash("error", "Incorrect email or password")
    res.redirect("/login")
}))

router.post("/register", validateUser, catchAsync(async (req, res) => {
    const { user: u } = req.body
    const user = new User(u)
    await user.save()
    req.session.userId = user.id
    req.flash("success", "Successfully created account!")
    res.redirect(res.redirect(req.session.previousUrl || "/"))
}))

router.get("/logout", (req, res) => {
    req.session.user = null
    req.flash("success", "Logged out successfully!")
    res.redirect("/")
})

router.get("/order", isLoggedIn, catchAsync(async (req, res) => {
    const line_items = []
    const cart = req.session.cart
    for (let product of cart) {
        const found = await Product.findById(product.id)
        if (found) {
            line_items.push({
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: found.name,
                        description: found.description
                    },
                    unit_amount: found.discount ? found.discountedPrice * 100 : found.price * 100
                },
                quantity: product.qty
            })
        }
    }
    console.log(line_items)
    const session = await stripe.checkout.sessions.create({
        line_items,
        customer_email: req.user.email,
        mode: 'payment',
        success_url: `http://localhost:3000/`,
        cancel_url: `http://localhost:3000/error`,
        shipping_address_collection: {
            allowed_countries: ["GB"]
        }
    });

    res.redirect(303, session.url)
}))

module.exports = router