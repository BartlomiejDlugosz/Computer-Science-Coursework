// Imports the error handling functions
const { ExpressError } = require("./errorhandling")

// Defines a presence check
module.exports.presenceCheck = (value, errMsg) => {
    // Checks if the value exists, used this approach as values like 0 and false can also return false when a value exists
    if (value !== undefined && value !== null && value !== "") {
        return true
    }
    // Throws a error if the value fails the presence check
    throw new ExpressError(errMsg || "Missing value")
}

// Defines a data type check
module.exports.dataTypeCheck = (value, dataType, errMsg, optional) => {
    // If it's optional and the value doesn't exist then return true
    if (optional && (value === undefined || value === null || value === "")) return true
    // Checks if the value is an array and the data type isn't an array, this is because arrays can cause issues for the number check
    if (Array.isArray(value) && dataType !== "array") throw new ExpressError(errMsg || "Data is invalid type")
    // Returns true if the value is an array and the data type is an array
    if (dataType === "array" && Array.isArray(value)) return true
    // Attempts to parse the value if it should be a number
    else if (dataType === "number") value = parseFloat(value.toString())
    // Parses the value if it should be a boolean
    else if (dataType === "boolean") value = value.toString() === "true"
    // Checks if the type of the value matches the data type
    if (typeof value === dataType) {
        return true
    }
    // Throws an error if it fails
    throw new ExpressError(errMsg || "Data is invalid type")
}

// Defines a max length check
module.exports.maxLengthCheck = (value, length, errMsg, optional) => {
    // If it's optional and the value doesn't exist then return true
    if (optional && (value === undefined || value === null || value === "")) return true
    // Checks if the length of the value is less than the length given
    if (value && value.length <= length) {
        return true
    }
    // Throws an error if this validation failed
    throw new ExpressError(errMsg || `Data must be longer than ${length} characters`)
}

// Defines a min length check
module.exports.minLengthCheck = (value, length, errMsg, optional) => {
    // If it's optional and the value doesn't exist then return true
    if (optional && (value === undefined || value === null || value === "")) return true
    // Checks if the length of the value is greater than the length given
    if (value && value.length >= length) {
        return true
    }
    // Throws an error if this validation failed
    throw new ExpressError(errMsg || `Data must be longer than ${length} characters`)
}

// Defines a minimum check
module.exports.min = (value, low, errMsg, optional) => {
    // If it's optional and the value doesn't exist then return true
    if (optional && (value === undefined || value === null || value === "")) return true
    // Checks if the value is greater than the value given
    if (value && value > low) {
        return true
    }
    // Throws an error if this validation failed
    throw new ExpressError(errMsg || `Data must be greater than ${low}`)
}

// Defines a maximum check
module.exports.max = (value, high, errMsg, optional) => {
    // If it's optional and the value doesn't exist then return true
    if (optional && (value === undefined || value === null || value === "")) return true
    // Checks if the value is less than the value given
    if (value && value < high) {
        return true
    }
    // Throws an error if this validation failed
    throw new ExpressError(errMsg || `Data must be less than ${high}`)
}

// Defines a email check
module.exports.emailCheck = (value, errMsg) => {
    // Checks if the value exists and if it matches the regex pattern for a email
    if (value && value.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) return true
    // Throws an error if this validation failed
    throw new ExpressError(errMsg || "Invalid email")
}