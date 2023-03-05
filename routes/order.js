// Library imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object which makes it easier to split routes into different files
const router = express.Router()
// Constains the stripe library, initializing it with the key
const stripe = require("stripe")(process.env.STRIPE_KEY)

// Function imports
// Imports the error handling functions
const { catchAsync } = require("../utils/errorhandling")
// Imports the middleware required
const { isLoggedIn } = require("../utils/middleware")

// Model imports
// Imports the user
const User = require("../Models/User")

// Defines the route for /success after the user has successfully made a purchase
router.get("/success", isLoggedIn, catchAsync(async (req, res) => {
    // Extracts the session id from the query
    const { session_id } = req.query
    // Retrieves the information about that specific session
    const session = await stripe.checkout.sessions.retrieve(session_id)
    // Finds the user the order was associated with
    const user = await User.findById(session.metadata.userId)
    // If the user matches the currently logged in user then the template is rendered
    if (user.id === req.user.id) {
        // Renders the template if it's a match
        return res.render("order/success", {})
    }
    // If the users don't match then a error is flashed and the user is redirected to the home page
    req.flash("error", "You do not have access to this")
    res.redirect("/")
}))

// Exports the router
module.exports = router