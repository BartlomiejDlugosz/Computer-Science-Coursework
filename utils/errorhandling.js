module.exports.catchAsync = func => {
    return function (req, res, next) {
        func(req, res, next).catch(e => next(e))
    }
}

class ExpressError extends Error {
    constructor(message, status) {
        super()
        this.message = message
        this.status = status
    }
}

module.exports.ExpressError = ExpressError