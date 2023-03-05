// This defines a function to catch any errors that may occur within async functions
// These errors aren't handled by default so require a handler to prevent the web
// app from crashing
module.exports.catchAsync = func => {
    return function (req, res, next) {
        func(req, res, next).catch(e => {
            // Log the error for easier debugging
            console.log(e)
            next(e)
        })
    }
}

// Defines a custom error class containing a message and a status
class ExpressError extends Error {
    constructor(message, status) {
        super()
        this.message = message
        this.status = status
    }
}

// Exports the functions
module.exports.ExpressError = ExpressError