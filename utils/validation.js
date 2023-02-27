const { ExpressError } = require("./errorhandling")

// Defines a presence check
module.exports.presenceCheck = (value, errMsg) => {
    // Returns whatever the statement evaluates too
    if (value !== undefined && value !== null && value !== "") {
        return true
    }
    throw new ExpressError(errMsg || "Missing value")
}

// Defines a data type check
module.exports.dataTypeCheck = (value, dataType, errMsg, optional) => {
    if (optional && (value === undefined || value === null || value === "")) return true
    if (Array.isArray(value) && dataType !== "array") throw new ExpressError(errMsg || "Data is invalid type")
    if (dataType === "array" && Array.isArray(value)) return true
    else if (dataType === "number") value = parseFloat(value.toString())
    else if (dataType === "boolean") value = value.toString() === "true"
    if (typeof value === dataType) {
        return true
    }
    throw new ExpressError(errMsg || "Data is invalid type")
}

// Defines a length check
module.exports.maxLengthCheck = (value, length, errMsg, optional) => {
    if (optional && (value === undefined || value === null || value === "")) return true
    if (value && value.length <= length) {
        return true
    }
    throw new ExpressError(errMsg || `Data must be longer than ${length} characters`)
}
module.exports.minLengthCheck = (value, length, errMsg, optional) => {
    if (optional && (value === undefined || value === null || value === "")) return true
    if (value && value.length >= length) {
        return true
    }
    throw new ExpressError(errMsg || `Data must be longer than ${length} characters`)
}

// Defines a range check
module.exports.min = (value, low, errMsg, optional) => {
    if (optional && (value === undefined || value === null || value === "")) return true
    if (value && value > low) {
        return true
    }
    throw new ExpressError(errMsg || `Data must be greater than ${low}`)
}

module.exports.max = (value, high, errMsg, optional) => {
    if (optional && (value === undefined || value === null || value === "")) return true
    if (value && value < high) {
        return true
    }
    throw new ExpressError(errMsg || `Data must be less than ${high}`)
}

module.exports.emailCheck = (value, errMsg) => {
    if (value && value.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) return true
    throw new ExpressError(errMsg || "Invalid email")
}