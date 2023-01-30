// Library imports
const express = require("express")
const router = express.Router()
const stripe = require('stripe')(process.env.STRIPE_KEY)
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const ejs = require("ejs")
const path = require("path")

// Function imports
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { validateUser, isLoggedIn, savePreviousUrl, notLoggedIn } = require("../utils/middleware")

// Model imports
const User = require("../Models/User")
const Product = require("../Models/Product")
const Order = require("../Models/Order")

// Holds the signing secret, used for verifying requests
const endpointSecret = process.env.SIGNING_SECRET;

// Defines the nodemailer object, used for sending emails
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: "bartlomiejd15@gmail.com",
        pass: process.env.EMAIL_PASSWORD
    },
    secure: true
})

// Defines the route to render the account menu
router.get("/account", isLoggedIn, (req, res) => {
    res.render("account")
})

// Defines the route to render the form to login
router.get("/login", savePreviousUrl, notLoggedIn, (req, res) => {
    res.render("user/login")
})

// Defines the route to render the form to register
router.get("/register", savePreviousUrl, notLoggedIn, (req, res) => {
    res.render("user/register")
})

// Defines the route to login
router.post("/login", notLoggedIn, catchAsync(async (req, res) => {
    const { user: u } = req.body
    // Finds the user based on the email provided
    const user = await User.findOne({ email: u.email })
    if (user) {
        // Checks if the passwords match
        if (await bcrypt.compare(u.password, user.password)) {
            // If the passwords match then the user is saved to the session
            req.session.userId = user.id
            // If the session contains a cart then it's transferred to the user
            if (req.cart.getCartLength() > 0) {
                user.cart = req.session.cart.cart
                await user.save()
            }
            req.flash("success", "Successfully logged in!")
            return res.redirect(req.session.previousUrl || "/")
        }
    }
    req.flash("error", "Incorrect email or password")
    res.redirect("/login")
}))

// Defines the route to register
// Validates the body to ensure correct information is provided
router.post("/register", notLoggedIn, validateUser, catchAsync(async (req, res) => {
    const { user: u } = req.body
    // Creates a new user with the information provided
    const user = new User(u)
    await user.save()
    // The userid is saved to the session
    req.session.userId = user.id
    // If the session contains a cart then it's transferred to the user
    if (req.cart.getCartLength() > 0) {
        user.cart = req.session.cart.cart
        await user.save()
    }
    req.flash("success", "Successfully created account!")
    res.redirect(req.session.previousUrl || "/")
}))

// Defines the route to logout
router.get("/logout", (req, res) => {
    // Removes the users id from the session and their cart
    req.session.userId = null
    req.session.cart = null
    req.flash("success", "Logged out successfully!")
    // IgnoreAuth is to prevent the user being redirected straight to a login-required 
    // route so redirects to home instead
    req.flash("ignoreAuth", true)
    res.redirect(req.headers.referer || "/")
})

// Defines the route to order
router.get("/order", isLoggedIn, catchAsync(async (req, res) => {
    const line_items = []
    const cart = req.cart

    try {
        await cart.validateCart()
    } catch(e) {
        req.flash("error", `One or more items in your cart are out of stock and have been removed for you`)
        return res.redirect("/cart")
    }

    for (let item of cart.cart) {
        const found = await Product.findById(item.id)
        line_items.push({
            price_data: {
                currency: "gbp",
                product_data: {
                    name: found.name,
                    description: found.description,
                    // Stores the product id so it can be identified once processed
                    metadata: { id: found.id }
                },
                // Uses either discounted price or real price and multiplies by 100
                // as it's required to be in pence. Round is used due to multiplying errors in javascript
                unit_amount: Math.round(found.discount ? found.discountedPrice * 100 : found.price * 100)
            },
            quantity: item.qty
        })
    }

    // This creates the full url that will be used for the success
    // This is to prevent having to change this between localhost and real url
    const fullUrl = req.protocol + '://' + req.get('host')
    // Creates a new stripe session with all the information
    const session = await stripe.checkout.sessions.create({
        line_items,
        customer_email: req.user.email,
        mode: 'payment',
        // Will format the urls appropriately
        success_url: `${fullUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${fullUrl}/cart`,
        shipping_address_collection: {
            allowed_countries: ["GB"]
        },
        // User id is saved to metadata so the user can be found later
        metadata: { userId: req.user.id }
    });

    // Redirect to the session url from stripe
    res.redirect(303, session.url)
}))

// Defines a url for update an order
// A protected route and can only be accessed with correctly signed information

// Note: If an error occurs, stripe will keep resending the request every hour until successfull
router.post("/orderupdate", express.json(), catchAsync(async (req, res) => {
    const payload = req.body
    const sig = req.headers['stripe-signature']
    let event

    try {
        // Attempts to verify the information received by reconstructing it with the endpoint secret
        // This is to ensure hackers don't spoof requests and create orders
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
    } catch (e) {
        // If an error occurs then don't procede as the information can't be verified
        console.log(e)
        throw new ExpressError("Webhook error!")
    }

    try {
        // Makes sure the type of event is an order has been successfully completed
        if (event.type === "checkout.session.completed") {
            // Retrieves all the products from the order
            const lineItemsSession = await stripe.checkout.sessions.listLineItems(event.data.object.id, {
                expand: ["data.price.product"]
            })
            // Extracts the user id from the order and finds the user
            const customerId = event.data.object.metadata.userId
            const customer = await User.findById(customerId)
            const productIds = []
            // Goes through all the products in the order and adds them to an array in the correct format
            for (let obj of lineItemsSession.data) {
                let productId = obj.price.product.metadata.id
                let qty = obj.quantity
                // Finds the product and updates it's stock accordingly
                const product = await Product.findById(productId)
                product.stock -= qty
                product.sales += qty
                product.save()
                productIds.push({ id: productId, qty })
            }
            // Defines all the variables required for creating a new order
            const date = new Date(event.created * 1000)
            const object = event.data.object
            const total = object.amount_total / 100
            const name = object.shipping.name
            const address = object.shipping.address
            const transactionId = object.payment_intent

            // Creates a new order with all the given information
            const newOrder = new Order({ userId: customerId, productIds, date, total, name, address, transactionId })
            await newOrder.save()

            // Adds the order to the customers account and wipes their cart
            customer.orders.push(newOrder.id)
            customer.cart = []
            await customer.save()

            // Retrieves a populated version of the order
            const populatedOrder = await Order.populate(newOrder, { path: "userId productIds.id" })

            // Creates a html template than can be used to send as an email
            ejs.renderFile(path.join(__dirname, "../views/email.ejs"), { order: populatedOrder }, (err, data) => {
                if (err) console.log(err)
                else {
                    // Defines the email data including the customers email and the html data
                    const mailData = {
                        from: "bartlomiejd15@gmail.com",
                        to: customer.email,
                        subject: "Order confirmation",
                        html: data
                    }
                    // A confirmation email is sent to the customer
                    transporter.sendMail(mailData, (err, info) => {
                        if (err) console.log(err)
                    })
                }
            })


        }
    } catch (e) {
        console.log(e)
    }

    res.status(200).end()
}))

module.exports = router