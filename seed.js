const mongoose = require("mongoose")

const User = require("./Models/User")
const Order = require("./Models/Order")
const Product = require("./Models/Product")
const Category = require("./Models/Category")

mongoose.connect("mongodb+srv://shopApp:Fy6OpjfLwaaEV79D@bookings.owfjo.mongodb.net/ShopApp")
.then(data => {
    console.log("Connected to mongo")
})
.catch(err => {
    console.log("An error has occured!")
    console.log(err)
})

const products = [
    {
        name: "Iphone 14 Pro Max",
        price: 1199.99,
        description: "A top of the line, brand new Iphone 14 pro max featuring apples latest chipset."
    },
    {
        name: "Galaxy S22",
        price: 999.99,
        description: "A brand new addition from samsung including their latest flagship smartphone!"
    },
    {
        name: "Macbook Pro 2022",
        price: 2199.99,
        description: "Apple's state of the art laptop, including the brand new M1 chip for increased performance."
    }
]

Product.insertMany(products)
.then(data => {
    console.log(data)
})
.catch(err => {
    console.log("Error ocurred!")
    console.log(err)
})