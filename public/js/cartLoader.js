let cart = JSON.parse(localStorage.getItem("cart"))
const order = document.querySelector("#order")
const container = document.querySelector(".row")
const template = document.querySelector("#template")

function removeFromCart(id) {
  cart = JSON.parse(localStorage.getItem("cart"))
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      cart.splice(i, 1)
      break
    }
  }
  localStorage.setItem("cart", JSON.stringify(cart))
}

async function addItems() {
  console.log("ADDING")
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
      console.log(products)
      for (let data of products) {
        productDiv = template.content.cloneNode(true)

        productDiv.querySelector(".name").textContent = data.product.name
        productDiv.querySelector(".price").textContent = `£${data.product.price}`
        productDiv.querySelector(".description").textContent = data.product.description
        productDiv.querySelector(".qty").textContent = `Quantity: ${data.qty}`
        productDiv.querySelector(".removeProduct").id = data.product._id
        productDiv.querySelector(".removeProduct").addEventListener("click", () => {
          removeFromCart(data.product._id)
        })

        container.appendChild(productDiv)
      }

      order.hidden = false

    }).catch(function () {
      console.log("Error Occured!");
    });

}

order.addEventListener("click", async () => {
  cart = JSON.parse(localStorage.getItem("cart"))
  let items = document.querySelectorAll(".item")
  items.forEach(item => {
    item.remove()
  })

  let info = document.createElement("p")
  info.classList.add("lead")
  info.textContent = "Processing your order..."
  container.appendChild(info)

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
      console.log(data)
      if (data.status === "Success") {
        info.textContent = "Order placed successfully!"
        cart = []
        localStorage.setItem("cart", JSON.stringify([]))
      } else if (data.status === "Out of stock") {
        info.textContent = data.errorMessage
        removeFromCart(data.product._id)
        console.log("Error occured")
      }
    })
})


console.log(cart)
if (cart && cart.length !== 0) {
  addItems()
} else {
  let info = document.createElement("p")
  info.classList.add("lead")
  info.textContent = "Sorry, but you don't have any products in your cart"
  container.appendChild(info)
}