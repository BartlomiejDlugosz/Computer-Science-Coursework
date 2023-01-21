// Library imports
const express = require("express")
const router = express.Router()
const stripe = require("stripe")(process.env.STRIPE_KEY)

// Function imports
const { catchAsync } = require("../utils/errorhandling")
const { isLoggedIn } = require("../utils/middleware")

// Model imports
const User = require("../Models/User")

// Defines the route for /success after the user has successfully made a purchase
router.get("/success", isLoggedIn, catchAsync(async (req, res) => {
    const { session_id } = req.query
    // Gets the session Id and checks if the logged in user matches
    const session = await stripe.checkout.sessions.retrieve(session_id)
    const user = await User.findById(session.metadata.userId)
    if (user.id === req.user.id) {
        // Renders the template if it's a match
        return res.render("order/success", {})
    }
    // Displays an error and redirects
    req.flash("error", "You do not have access to this")
    res.redirect("/")
}))

module.exports = router