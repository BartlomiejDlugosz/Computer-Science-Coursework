const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const app = express()

const User = require("./Models/User")
const Order = require("./Models/Order")
const Product = require("./Models/Product")
const Category = require("./Models/Category")

mongoose.connect("mongodb://localhost:27017/ShopApp")
.then(data => {
    console.log("Connected to mongo")
})
.catch(err => {
    console.log("An error has occured!")
    console.log(err)
})

const PORT = 3000


app.use("view engine", "ejs")
app.use("views", path.join(__dirname, "views"))


app.listen(PORT, () => {
    console.log(`Running on port ${PORT}!`)
})