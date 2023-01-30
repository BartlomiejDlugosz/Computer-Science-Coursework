// Function imports
const { ExpressError } = require("./errorhandling")

// Model imports
const User = require("../Models/User")
const Product = require("../Models/Product")

// This function gets the amount of stock for a given product
const getProductStock = async (productId) => {
    try {
        const prod = await Product.findById(productId).select("stock")
        return prod.stock
    } catch (e) {
        // Returns null if product isn't found
        return null
    }
}

// Defines a class for the cart
class Cart {
    // Defines the constructor class
    constructor(userId, cart) {
        // Use the cart given or use a empty array
        this.cart = cart || []
        this.userId = userId
    }

    // This function saves the cart to the session or the user
    async saveCart(req) {
        if (!this.userId) {
            req.session.cart = { userId: this.userId, cart: this.cart }
            return true
        }
        await User.findByIdAndUpdate(this.userId, { cart: this.cart })
        return true
    }

    // Defines a function to populate the cart
    // This goes through and fills in all the product information for each item in the cart
    async populateCart() {
        const returnArray = []
        for (let product of this.cart) {
            const prod = await Product.findById(product.id)
            returnArray.push({ product: prod, qty: product.qty })
        }
        return returnArray
    }

    // Defines a function to return the length of the cart
    getCartLength() {
        return this.cart.reduce((acc, num) => acc + num.qty, 0)
    }

    // Defines a function to find a item in the cart by id and return the item
    findInCart(itemId) {
        for (let item of this.cart) {
            if (item.id.toString() === itemId) return item
        }
        return null
    }

    // Defines a function to find an item in the cart by id and return the index
    findInCartIndex(itemId) {
        for (let i = 0; i < this.cart.length; i++) {
            if (this.cart[i].id.toString() === itemId) return i
        }
        return null
    }

    // Validates all the products in the cart to ensure all the quanitites are right
    async validateCart() {
        // Loops through each item
        for (let item of this.cart) {
            // Finds the item and checks the quantity doesn't exceed the stock
            const stock = await getProductStock(item.id)
            if (stock) {
                if (item.qty > stock) {
                    item.qty = stock
                    this.saveCart()
                    return new ExpressError("You have too many of this product in your cart!")
                }
                if (item.qty <= 0) {
                    this.removeItem(item.id)
                    this.saveCart()
                    return new ExpressError("Product was removed")
                }
            } else {
                this.removeItem(item.id)
                this.saveCart()
                return new ExpressError("Product not found")
            }
        }
        return true
    }

    // Defines a function to add a item to the cart based on the given itemId
    // Also takes the request object to save the cart to the session
    async addItem(req, itemId) {
        // Gets stock and validates it
        const stock = await getProductStock(itemId)
        if (!stock) return new ExpressError("Product not found!", 500)
        if (stock <= 0) return new ExpressError("This product is out of stock!", 500)

        // Trys to find the item in the cart
        // If found then it's quantity is updated, if not then it's added
        const cartItem = this.findInCart(itemId)
        if (cartItem) {
            if (cartItem.qty >= stock) return new ExpressError("You have too many of this product in your cart!", 500)
            cartItem.qty += 1
        } else {
            this.cart.push({ id: itemId, qty: 1 })
        }
        this.saveCart(req)
        return { msg: "Successfully added item to cart!", status: 200 }
    }

    // Defines a function to modify a current item in the cart
    // Also takes the request object to save the cart to the session
    async modifyItem(req, itemId, operator) {
        // Gets stock and validates it
        const stock = await getProductStock(itemId)
        if (!stock) return new ExpressError("Product not found!", 500)

        // Finds the item in the cart
        const cartItem = this.findInCart(itemId)
        if (!cartItem) return new ExpressError("Product not found!", 500)

        // Updates the item accordingly
        cartItem.qty += operator === "add" ? 1 : -1

        // Makes sure the quantity is valid
        if (cartItem.qty > stock) {
            cartItem.qty = stock
            return new ExpressError("You have too many of this product in your cart!")
        }
        if (cartItem.qty <= 0) this.removeItem(itemId)

        this.saveCart(req)
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

        this.saveCart(req)
        return { msg: "Successfully updated cart!", status: 200 }
    }
}

module.exports.Cart = Cart