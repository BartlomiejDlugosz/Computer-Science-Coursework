let cart = localStorage.getItem("cart") || []

const addButtons = document.querySelectorAll("a.addProduct")

addButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (!button.classList.contains("added")) {
            button.classList.add("added")
            let cart = localStorage.getItem("cart") || []
            cart.append(button.id)
            localStorage.setItem("cart", cart)

            button.innerHTML = "Added"
            setTimeout(() => {
                button.classList.remove("added")
            }, 1000)
        }
    })
})