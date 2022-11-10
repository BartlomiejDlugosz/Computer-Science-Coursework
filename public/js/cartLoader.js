let cart = JSON.parse(localStorage.getItem("cart"))
const container = document.querySelector(".row")
const template = document.querySelector("#template")

async function addItem(productId) {
    fetch(`/getProductInfo?id=${productId}`).then(function (response) {
        return response.json();
    }).then(function (data) {
        console.log(data)
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

    }).catch(function () {
        console.log("Error Occured!");
    });
}
console.log(cart)
if (cart && cart === []) {
    cart.forEach(productId => {
        addItem(productId)
    })
} else {
    let info = document.createElement("p")
    info.classList.add("lead")
    info.textContent = "Sorry, but you don't have any products in your cart"
    container.appendChild(info)
}