let cart = localStorage.getItem("cart")
const container = document.querySelector(".container")
const template = document.querySelector("#template")

async function addItem(productId) {
    fetch(`/getProductInfo?id=${productId}`).then(function(response) {
        return response.json();
      }).then(function(data) {
        productDiv = template.content.cloneNode(true)

        productDiv.querySelector(".name").textContent = data.name
        productDiv.querySelector(".price").textContent = `£${data.price}`
        productDiv.querySelector(".description").textContent = data.description
        productDiv.querySelector(".removeProduct").id = data.id
        productDiv.querySelector(".removeProduct").addEventListener("click", () => {
            let cart = localStorage.getItem("cart")
            for (let i = 0; i < cart.length; i++) {
                if (cart[i] === data.id) {
                    cart.splice(i, 1)
                    break
                }
            }
            localStorage.setItem("cart", cart)
        })

        container.appendChild(productDiv)

      }).catch(function() {
        console.log("Error Occured!");
      });
}

if (cart) {
    cart.forEach(productId => {
        addItem(productId)
    })
} else {
    
}