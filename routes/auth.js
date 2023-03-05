// Library imports
// Contains the express library responsible for handling all the web requests
const express = require("express")
// This contains a express router which can be used for splitting routes up into different files
const router = express.Router()
// Contains the stripe library responsible for handling the payments. It also initializes it with the stripe key
const stripe = require('stripe')(process.env.STRIPE_KEY)
// Contains the bcrypt library responsible for hashing passwords as well as authenticating them
const bcrypt = require("bcrypt")
// Contains the nodemailer library responsible for sending emails
const nodemailer = require("nodemailer")
// Contains the ejs library responsible for rendering html templates
const ejs = require("ejs")
// Contains the path library responsible for defining paths relative to the file
const path = require("path")

// Function imports
// Imports the 2 functions from the errorhandling file used to handle errors
const { catchAsync, ExpressError } = require("../utils/errorhandling")
// Imports some middleware that will be required later
const { validateUser, isLoggedIn, savePreviousUrl, notLoggedIn } = require("../utils/middleware")

// Model imports
// Imports the User model
const User = require("../Models/User")
// Imports the Product model
const Product = require("../Models/Product")
// Imports the Order model
const Order = require("../Models/Order")

// Holds the signing secret, used for verifying requests
const endpointSecret = process.env.SIGNING_SECRET;

// Defines the nodemailer object, used for sending emails
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: "***REMOVED***",
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
// Uses middleware to ensure the user is not already logged in
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
    // An error is displayed otherwise
    req.flash("error", "Incorrect email or password")
    res.redirect("/login")
}))

// Defines the route to register
// Uses middleware to make sure the user is not already logged in, and also validates the information
// passed through in the body to ensure it's in the right format
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
    // A success message is displayed and the user is redirected
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
    // route so redirects to home instead. e.g. if the user was on the account page and they log out, this is to ensure they don't
    // get redirected to a login form straight after
    req.flash("ignoreAuth", true)
    res.redirect(req.headers.referer || "/")
})

// Defines the route to order the items in your cart
router.get("/order", isLoggedIn, catchAsync(async (req, res) => {
    // This will contain all the products that the user wants to buy. This is required because stripe requires the products
    // to be passed in in a certain format
    const line_items = []
    // Gets the current cart associated with the request
    const cart = req.cart

    // This will validate the cart by checking all the items are in stock, and quantities don't exceed the stock levels
    try {
        await cart.validateCart()
    } catch (e) {
        // Display a error and redirect to their cart
        req.flash("error", `One or more items in your cart are out of stock and have been removed for you`)
        return res.redirect("/cart")
    }

    // This goes through all the items in the cart
    for (let item of cart.cart) {
        // Querys for the product from the database
        const found = await Product.findById(item.id)
        // Adds a new object to the array in the format required by stripe
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

    // This creates the full url that will be used for the success url
    // This is to prevent having to change this between localhost and real url and makes testing easier
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
    // This extracts the information in the body
    const payload = req.body
    // Gets the stripe signature from the headers
    const sig = req.headers['stripe-signature']
    let event

    try {
        // Attempts to verify the information received by reconstructing it with the endpoint secret
        // This is to ensure hackers don't spoof requests and create orders
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
    } catch (e) {
        // If an error occurs then we don't procede as the information can't be verified
        console.log(e)
        throw new ExpressError("Webhook error!")
    }

    try {
        // Makes sure the type of event is an order has been successfully completed
        if (event.type === "checkout.session.completed") {
            // Retrieves all the products from the order expanding the information about the products
            const lineItemsSession = await stripe.checkout.sessions.listLineItems(event.data.object.id, {
                expand: ["data.price.product"]
            })
            // Extracts the user id from the order and finds the user
            const customerId = event.data.object.metadata.userId
            // Finds the user in our database
            const customer = await User.findById(customerId)
            // This array will store the products purchased in our own format which is [{id: productId, qty: quantity}]
            const productIds = []
            // Goes through all the products in the order and adds them to an array in the correct format
            for (let obj of lineItemsSession.data) {
                let productId = obj.price.product.metadata.id
                let qty = obj.quantity
                // Finds the product and updates it's stock accordingly
                const product = await Product.findById(productId)
                product.stock -= qty
                // We increment the number of sales by the quantity
                product.sales += qty
                product.save()
                // We're adding the object into the array
                productIds.push({ id: productId, qty })
            }
            // Defines all the variables required for creating a new order
            const date = new Date(event.created * 1000)
            // Used as a placeholder variable to simplify retrieving other information
            const object = event.data.object
            const total = object.amount_total / 100
            const name = object.shipping.name
            const address = object.shipping.address
            const transactionId = object.payment_intent

            // Creates a new order with all the given information and saves it
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
                        from: "***REMOVED***",
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
        // Throws a error if something goes wrong
        console.log(e)
        throw new ExpressError("Error occured")
    }

    // Sends back a 200 status code. This tells stripe it's correctly been handled 
    // If stripe doesn't receive this then it will keep retrying the request every couple of minutes until it's been correctly handled
    res.status(200).end()
}))

// Exports the router object
module.exports = router