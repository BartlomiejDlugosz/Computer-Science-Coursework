const express = require("express")
const router = express.Router()
const stripe = require("stripe")('sk_test_51Klf4uDwkLbs7UhvgbC57fRb7nIeEBOALxPj2tVqkflB1eh3g9fekCGvOloPBBepqtwmOx7tfOjLpzow0KIin0ck00ePvuSr3S')

const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { isLoggedIn } = require("../utils/middleware")
const User = require("../Models/User")

router.get("/success", isLoggedIn, catchAsync(async (req, res) => {
    const { session_id } = req.query
    const session = await stripe.checkout.sessions.retrieve(session_id)
    const user = await User.findById(session.metadata.userId)
    if (user.id === req.user.id) {
        return res.render("order/success", {})
    }
    req.flash("error", "You do not have access to this")
    res.redirect("/")
}))

module.exports = router