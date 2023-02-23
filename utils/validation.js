const { ExpressError } = require("./errorhandling")

// Defines a presence check
module.exports.presenceCheck = (value, errMsg) => {
    // Returns whatever the statement evaluates too
    if (value && value !== "") {
        return true
    }
    return new ExpressError(errMsg || "Missing value")
}

// Defines a data type check
module.exports.dataTypeCheck = (value, dataType, errMsg, optional) => {
    if (optional && !value) return true
    if (dataType === "array" && Array.isArray(value)) return true
    if (value && typeof value === dataType) {
        return true
    }
    return new ExpressError(errMsg || "Data is invalid type")
}

// Defines a length check
module.exports.lengthCheck = (value, length, errMsg, optional) => {
    if (optional && !value) return true
    if (value && value.length >= length) {
        return true
    }
    return new ExpressError(errMsg || `Data must be longer than ${length} characters`)
}

// Defines a range check
module.exports.min = (value, low, errMsg, optional) => {
    if (optional && !value) return true
    if (value && value >= low) {
        return true
    }
    return new ExpressError(errMsg || `Data must be greater than ${low}`)
}

module.exports.max = (value, high, errMsg, optional) => {
    if (optional && !value) return true
    if (value && value <= high) {
        return true
    }
    return new ExpressError(errMsg || `Data must be less than ${high}`)
}