const express = require("express")
const router = express.Router()

const bcrypt = require("bcrypt")
const User = require("../Models/User")
const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { validateUser } = require("../utils/middleware")

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
            req.session.user = user
            req.flash("success", "Successfully logged in!")
            return res.redirect("/")
        }
    }
    req.flash("error", "Incorrect email or password")
    res.redirect("/login")
}))

router.post("/register", validateUser, catchAsync(async (req, res) => {
    const { user: u } = req.body
    const user = new User(u)
    await user.save()
    req.session.user = user
    req.flash("success", "Successfully created account!")
    res.redirect("/")
}))

router.get("/logout", (req, res) => {
    req.session.user = null
    req.flash("success", "Logged out successfully!")
    res.redirect("/")
})

module.exports = router