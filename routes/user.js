const express = require("express")
const Order = require("../Models/Order")
const router = express.Router()
const bcrypt = require("bcrypt")

const { catchAsync, ExpressError } = require("../utils/errorhandling")
const { isLoggedIn, isStaff, validateUser } = require("../utils/middleware")
const User = require("../Models/User")

router.get("/orders", isLoggedIn, catchAsync(async (req, res) => {
    const populatedUser = await Order.populate(req.user, { path: "orders" })
    res.render("user/orders", { user: populatedUser })
}))

router.get("/orders/:id", isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params
    const order = await Order.findById(id).populate("productIds.id userId")
    if (order) {
        if (req.user.id === order.userId.id) {
            return res.render("user/showOrder", { order })
        }
        req.flash("error", "You are not authorized to view that")
        return res.redirect("/menu")
    }
    req.flash("error", "Order not found!")
    res.redirect("/menu")
}))

router.get("/editDetails", isLoggedIn, catchAsync(async (req, res) => {
    const previous = req.flash("previous")
    if (previous.length > 0) {
        return res.render("user/editAccount", { user: previous[0] })
    }
    res.render("user/editAccount")
}))

router.put("/editdetails", isLoggedIn, validateUser, catchAsync(async (req, res) => {
    const { user } = req.body
    if (await bcrypt.compare(user.password, req.user.password)) {
        await req.user.save()
        req.flash("success", "Details updated successfully!")
        return res.redirect("/menu")
    }
    req.flash("previous", user)
    req.flash("error", "Incorrect password")
    res.redirect("/user/editdetails")
}))

router.get("/changepassword", isLoggedIn, (req, res) => {
    res.render("user/changepassword")
})

router.post("/changepassword", isLoggedIn, catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    if (await bcrypt.compare(currentPassword, req.user.password)) {
        req.user.password = newPassword
        await req.user.save()
        req.flash("success", "Successfully changed password")
        return res.redirect("/menu")
    }
    req.flash("error", "Incorrect password")
    res.redirect("/user/changepassword")
}))

router.get("/deleteaccount", isLoggedIn, (req, res) => {
    res.render("user/deleteaccount")
})

router.post("/deleteaccount", isLoggedIn, catchAsync(async (req, res) => {
    const { password } = req.body
    if (await bcrypt.compare(password, req.user.password)) {
        const user = await User.findById(req.user.id).populate("orders")
        console.log(user)
        for (let order of user.orders) {
            if (order.status === 1) {
                req.flash("error", "Please wait until all your pending orders have been fulfilled before deleting your account")
                return res.redirect("/menu")
            }
        }
        await user.remove()
        req.session.userId = null
        req.session.cart = []
        req.flash("success", "Account deleted successfully")
        return res.redirect("/")
    }
    req.flash("error", "Incorrect password")
    res.redirect("/user/deleteaccount")
}))

module.exports = router