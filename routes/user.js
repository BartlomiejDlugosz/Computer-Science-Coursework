// Library Imports
const express = require("express")
const Order = require("../Models/Order")
const router = express.Router()
const bcrypt = require("bcrypt")

// Function imports
const { catchAsync } = require("../utils/errorhandling")
const { isLoggedIn, validateUser } = require("../utils/middleware")

// Model imports
const User = require("../Models/User")

// Checks to make sure user is logged in when accessing any of these routes
router.use(isLoggedIn)

// Defines the route to view all the users orders
router.get("/orders", catchAsync(async (req, res) => {
    // Retrieves the user info along with their orders and passes it through to template
    const populatedUser = await Order.populate(req.user, { path: "orders" })
    res.render("user/orders", { user: populatedUser })
}))

// Defines the route to view a specific order
router.get("/orders/:id", catchAsync(async (req, res) => {
    const { id } = req.params
    // Finds the order and fills in the product and user info
    const order = await Order.findById(id).populate("productIds.id userId")
    // Ensures t he order exists
    if (order) {
        // Checks if the logged in user owns the order
        if (req.user.id === order.userId.id) {
            return res.render("user/showOrder", { order })
        }
        // If not then redirect to account menu
        req.flash("error", "You are not authorized to view that")
        return res.redirect("/account")
    }
    // Display error if order not found
    req.flash("error", "Order not found!")
    res.redirect("/account")
}))

// Defines route for displaying the form to edit their account details
router.get("/editDetails", catchAsync(async (req, res) => {
    // Checks if the user has any prefilled info from the last submit
    const previous = req.flash("previous")
    if (previous.length > 0) {
        // Renders template with prefilled information from users last submit
        return res.render("user/editAccount", { user: previous[0] })
    }
    // Renders template with the users currently saved info
    res.render("user/editAccount")
}))

// Defines route for editing user info
// Validates the body to ensure it's in the right format
router.put("/editdetails", validateUser, catchAsync(async (req, res) => {
    const { user } = req.body
    console.log(user)
    // Checks to ensure the password matches the saved one
    if (await bcrypt.compare(user.password, req.user.password)) {
        // Removes the password from the object to ensure the password isn't updated
        delete user.password
        // Finds the users document and updates it with the users info
        await User.findByIdAndUpdate(req.user.id, user)
        // Flashes a success message and redirects to account page
        req.flash("success", "Details updated successfully!")
        return res.redirect("/account")
    }
    // Saves the information the user entered so it can be filled again on refresh
    req.flash("previous", user)
    req.flash("error", "Incorrect password")
    res.redirect("/user/editdetails")
}))

// Defines route for displaying the change password form
router.get("/changepassword", (req, res) => {
    res.render("user/changepassword")
})

// Defines route for changing password
router.post("/changepassword", catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    // Checks to see if the password entered matches the current one
    if (await bcrypt.compare(currentPassword, req.user.password)) {
        // Sets the new password and saves it (password is encrypted in save middleware)
        req.user.password = newPassword
        await req.user.save()
        req.flash("success", "Successfully changed password")
        return res.redirect("/account")
    }
    // Displays error if the password isn't correct
    req.flash("error", "Incorrect password")
    res.redirect("/user/changepassword")
}))

// Defines route for displaying the delete account form
router.get("/deleteaccount", (req, res) => {
    res.render("user/deleteaccount")
})

// Defines the route for deleting your account
router.post("/deleteaccount", catchAsync(async (req, res) => {
    const { password } = req.body
    // Checks to see if the password matches
    if (await bcrypt.compare(password, req.user.password)) {
        const user = await User.findById(req.user.id).populate("orders")
        // Checks to make sure the user doesn't have any pending orders
        // that haven't been fulfilled yet
        for (let order of user.orders) {
            if (order.status === 1) {
                req.flash("error", "Please wait until all your pending orders have been fulfilled before deleting your account")
                return res.redirect("/account")
            }
        }
        // Removes user and removes the session info
        await user.remove()
        req.session.userId = null
        req.session.cart = []
        req.flash("success", "Account deleted successfully")
        return res.redirect("/")
    }
    // Displays error if the password isn't correct
    req.flash("error", "Incorrect password")
    res.redirect("/user/deleteaccount")
}))

// Exports the router containing all the routes
module.exports = router