// Function imports
// Imports the error handling functions
const { ExpressError } = require("./errorhandling")

// Model imports
// Imports the user model
const User = require("../Models/User")
// Imports the product model
const Product = require("../Models/Product")

// This function gets the amount of stock for a given product
const getProductStock = async (productId) => {
    try {
        // Finds the product and only gets the stock
        const prod = await Product.findById(productId).select("stock")
        // Returns the stock of the product
        return prod.stock
    } catch (e) {
        // Returns null if product isn't found or and error has occured
        return null
    }
}

// Defines a class for the cart object
class Cart {
    // Defines the constructor class
    constructor(userId, cart) {
        // Use the cart given or use a empty array
        this.cart = cart || []
        this.userId = userId
    }

    // This function saves the cart to the session or the user
    async saveCart(req) {
        // If there's no user id then save the cart to the session
        if (!this.userId) {
            req.session.cart = { userId: this.userId, cart: this.cart }
            return true
        }
        // Else find the user and update their cart
        await User.findByIdAndUpdate(this.userId, { cart: this.cart })
        return true
    }

    // Defines a function to populate the cart
    // This goes through and fills in all the product information for each item in the cart
    async populateCart() {
        // Creates a new array that will be returned
        const returnArray = []
        // Loops through all the products in the cart
        for (let product of this.cart) {
            // Finds the product
            const prod = await Product.findById(product.id)
            // A new object is added to the array containing the product and the product quantity
            returnArray.push({ product: prod, qty: product.qty })
        }
        // Returns the new array 
        return returnArray
    }

    // Defines a function to return the length of the cart
    getCartLength() {
        // Coutns the amoutn of items in the cart
        return this.cart.reduce((acc, num) => acc + num.qty, 0)
    }

    // Defines a function to find a item in the cart by id and return the item
    findInCart(itemId) {
        // Uses a linear search to search for a item and returns it
        // I decided to use a linear search as the items won't be sorted and the list won't be large (normally around 2 products)
        for (let item of this.cart) {
            if (item.id.toString() === itemId) return item
        }
        // Returns null if the item isn't found
        return null
    }

    // Defines a function to find an item in the cart by id and return the index
    findInCartIndex(itemId) {
        // Uses a linear search to search for the item and returns it's index, used for deleting where the index is required
        for (let i = 0; i < this.cart.length; i++) {
            if (this.cart[i].id.toString() === itemId) return i
        }
        // Returns null if the item isn't found
        return null
    }

    // Validates all the products in the cart to ensure all the quanitites are right
    async validateCart(req) {
        // Loops through each item
        for (let item of this.cart) {
            // Gets the product's stock level
            const stock = await getProductStock(item.id)
            // Checks to make sure we got a valid result back, maybe the product was deleted in the mean time
            if (stock) {
                // If the quantity is greater than the stock then set the quantity equal to the stock
                if (item.qty > stock) {
                    item.qty = stock
                    // Save the cart
                    this.saveCart(req)
                    // Throw an error
                    throw new ExpressError("You have too many of this product in your cart!")
                }
                // If the quantity is below 0 then remove the item
                if (item.qty <= 0) {
                    this.removeItem(req, item.id)
                    // Save the item
                    this.saveCart(req)
                    // Throw an error
                    throw new ExpressError("Product was removed")
                }
            } else {
                // Removes the item from the cart and saves it as the product no longer exists
                this.removeItem(req, item.id)
                this.saveCart(req)
                // Throws an error
                throw new ExpressError("Product not found")
            }
        }
        // Return true to say the carts been validated successfully
        return true
    }

    // Defines a function to add a item to the cart based on the given itemId
    // Also takes the request object to save the cart to the session
    async addItem(req, itemId) {
        // Gets the stock of the product and ensures it exists
        const stock = await getProductStock(itemId)
        if (!stock) throw new ExpressError("Product not found!", 500)
        // Makes sure the product is in stock
        if (stock <= 0) throw new ExpressError("This product is out of stock!", 500)

        // Trys to find the item in the cart
        // If found then it's quantity is updated, if not then it's added to the array
        const cartItem = this.findInCart(itemId)
        if (cartItem) {
            // Makes sure the quantity doesn't exceed the stock
            if (cartItem.qty >= stock) throw new ExpressError("You have too many of this product in your cart!", 500)
            // Increments the quantity by one
            cartItem.qty += 1
        } else {
            // Adds a new object to the cart containing the items id and the quantity
            this.cart.push({ id: itemId, qty: 1 })
        }
        // Saves the cart
        this.saveCart(req)
        // Returns a success message
        return { msg: "Successfully added item to cart!", status: 200 }
    }

    // Defines a function to modify a current item in the cart
    // Also takes the request object to save the cart to the session
    async modifyItem(req, itemId, operator) {
        // Gets stock and ensures it's valid
        const stock = await getProductStock(itemId)
        if (!stock) return new ExpressError("Product not found!", 500)

        // Finds the item in the cart and throws an error if it's not found
        const cartItem = this.findInCart(itemId)
        if (!cartItem) return new ExpressError("Product not found!", 500)

        // Increments the quantity if the operator is "add", otherwise it decrements it
        cartItem.qty += operator === "add" ? 1 : -1

        // Makes sure the quantity doesn't exceed the stock
        if (cartItem.qty > stock) {
            // If it does then the quantity is set to the stock
            cartItem.qty = stock
            // A error is thrown
            throw new ExpressError("You have too many of this product in your cart!")
        }
        // If the quantity is below 0 then the item is removed
        if (cartItem.qty <= 0) this.removeItem(req, itemId)
        // The cart is saved
        this.saveCart(req)
        // Returns a success message
        return { msg: "Successfully updated cart!", status: 200 }
    }

    // Defines a function to remove a item from the cart
    // Also takes the request object to save the cart to the session
    removeItem(req, itemId) {
        // Gets the index of the item in the cart
        const index = this.findInCartIndex(itemId)

        // Checks if the index is valid
        // Note if(0) returns false so extra check has to be made
        if (index || index === 0) this.cart.splice(index, 1)
        // Saves the cart
        this.saveCart(req)
        // Returns a success message
        return { msg: "Successfully updated cart!", status: 200 }
    }
}
// Exports the cart
module.exports.Cart = Cart