// Library imports
// Contains the express library responsible for handling web requests
const express = require("express")
// Contains the router object which makes it easier to split routes into different files
const router = express.Router()

//Function imports
// Imports the error handling functions
const { catchAsync } = require("../utils/errorhandling")
// Imports the necessary middleware
const { isLoggedIn, isOwner } = require("../utils/middleware")

// Model imports
// Imports the user model
const User = require("../Models/User")

// Uses this middleware on every route in this file.
// This ensures the user is logged in first
router.use(isLoggedIn)
// This then ensures the user has the staff permission level or higher to access these routes
router.use(isOwner)

// Defines a route to show the manage users menu
router.get("/", catchAsync(async (req, res) => {
    // Extracts the permission level from the query so we can filter users by that
    const { permLvl } = req.query
    // Will contain all the users to display
    let users
    // Checks if a perm level was provided
    if (permLvl) {
        // Gets all the users with the specified permission level
        users = await User.find({ permLvl })
    } else {
        // Gets all the users
        users = await User.find({})
    }
    // Renders the template with the users
    res.render("manageusers/all", { users })
}))

// Defines a route to allow a specific user to be edited
router.get("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Finds the specific user in the database
    const user = await User.findById(id)
    // Renders the edit user form with the following user information
    res.render("manageusers/user", { user })
}))

// Defines a route to update the users permission level
router.put("/:id", catchAsync(async (req, res) => {
    // Extracts the id from the parameters
    const { id } = req.params
    // Extracts the permision level from the body and defaults to 1 if not provided
    const { permLvl = 1 } = req.body
    // Finds user and updates their permission level
    await User.findByIdAndUpdate(id, { permLvl })
    // Flashes the success message and redirects back to edit the user
    req.flash("success", "Successfully updated users permission levels!")
    res.redirect(`/manageusers/${id}`)
}))

// Exports the router
module.exports = router