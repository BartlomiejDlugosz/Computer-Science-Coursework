// Library imports
const express = require("express")
const router = express.Router()

//Function imports
const { catchAsync } = require("../utils/errorhandling")
const { isLoggedIn, isOwner } = require("../utils/middleware")

// Model imports
const User = require("../Models/User")

// Protects these routes by ensuring user is logged in and has owner permissions
router.use(isLoggedIn)
router.use(isOwner)

// Defines a route to show the manage users menu
router.get("/manageusers", catchAsync(async (req, res) => {
    const { permLvl } = req.query
    let users
    // Allow filtering users by permission level
    if (permLvl) {
        users = await User.find({ permLvl })
    } else {
        users = await User.find({})
    }
    res.render("manageusers/all", { users })
}))

// Defines a route to allow a specific user to be edited
router.get("/manageusers/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const user = await User.findById(id)
    res.render("manageusers/user", { user })
}))

// Defines a route to update the users permission level
router.put("/manageusers/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    const { permLvl } = req.body
    // Finds user and updates their permission level
    await User.findByIdAndUpdate(id, { permLvl })
    req.flash("success", "Successfully updated users permission levels!")
    res.redirect(`/manageusers/${id}`)
}))

module.exports = router