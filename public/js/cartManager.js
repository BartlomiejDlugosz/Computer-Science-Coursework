let cart = JSON.parse(localStorage.getItem("cart")) || []

const addButtons = document.querySelectorAll("a.addProduct")

addButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (!button.classList.contains("added")) {
            button.classList.add("added")
            cart = JSON.parse(localStorage.getItem("cart")) || []
            cart.push(button.id)
            localStorage.setItem("cart", JSON.stringify(cart))

            button.innerHTML = "Added"
            setTimeout(() => {
                button.classList.remove("added")
                button.innerHTML = "Add to Cart"
            }, 1000)
        }
    })
})