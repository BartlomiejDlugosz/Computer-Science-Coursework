let cart = JSON.parse(localStorage.getItem("cart")) || []

const addButtons = document.querySelectorAll("a.addProduct")

addButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (!button.classList.contains("added")) {
            button.classList.add("added")
            cart = JSON.parse(localStorage.getItem("cart")) || []
            let found = false
            for (let product of cart) {
                if (product.id === button.id) {
                    product.qty += 1
                    found = true
                    break
                }
            }
            if (!found) {
                cart.push({id: button.id, qty: 1})
            }
            localStorage.setItem("cart", JSON.stringify(cart))

            button.innerHTML = "Added"
            setTimeout(() => {
                button.classList.remove("added")
                button.innerHTML = "Add to Cart"
            }, 1000)
        }
    })
})