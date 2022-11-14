let cart = JSON.parse(localStorage.getItem("cart"))
const order = document.querySelector("#order")
const container = document.querySelector(".row")
const template = document.querySelector("#template")

async function addItems() {
    fetch("/getProductInfo", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cart)
      })
      .then(function (response) {
        return response.json();
    }).then(function (products) {
        for (let data of products) {
            productDiv = template.content.cloneNode(true)

            productDiv.querySelector(".name").textContent = data.name
            productDiv.querySelector(".price").textContent = `£${data.price}`
            productDiv.querySelector(".description").textContent = data.description
            productDiv.querySelector(".removeProduct").id = data._id
            productDiv.querySelector(".removeProduct").addEventListener("click", () => {
                cart = JSON.parse(localStorage.getItem("cart"))
                for (let i = 0; i < cart.length; i++) {
                    console.log(`${cart[i]} ${data._id}`)
                    if (cart[i] === data._id) {
                        cart.splice(i, 1)
                        break
                    }
                }
                localStorage.setItem("cart", JSON.stringify(cart))
            })

            container.appendChild(productDiv)
        }

    }).catch(function () {
        console.log("Error Occured!");
    });

}

order.addEventListener("click", async () => {
    cart = JSON.parse(localStorage.getItem("cart"))
    fetch("/createOrder", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cart)
      })
      .then(response => {
        return response.json()
      })
      .then(data => {
        cart = []
        localStorage.setItem("cart", JSON.stringify(cart))
        location.reload()
      })
})


console.log(cart)
if (cart && cart === []) {
    addItems()
} else {
    let info = document.createElement("p")
    info.classList.add("lead")
    info.textContent = "Sorry, but you don't have any products in your cart"
    container.appendChild(info)
}