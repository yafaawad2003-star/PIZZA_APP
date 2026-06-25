import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3001/api";

function App() {
  const [menu, setMenu] = useState(null);
  const [selectedPizza, setSelectedPizza] = useState("margherita");
  const [selectedSize, setSelectedSize] = useState("small");
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [cart, setCart] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [customerError, setCustomerError] = useState("");

  const [searchId, setSearchId] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [searchError, setSearchError] = useState("");

  const [employeeOrders, setEmployeeOrders] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [employeeError, setEmployeeError] = useState("");
  const [deliveryError, setDeliveryError] = useState("");

  useEffect(() => {
    loadMenu();
    loadEmployeeOrders();
    loadDeliveryOrders();
  }, []);

  async function loadMenu() {
    try {
      const response = await fetch(`${API_URL}/menu`);
      const data = await response.json();
      setMenu(data);
    } catch (error) {
      setCustomerError("Could not load menu from server");
    }
  }

  async function loadEmployeeOrders() {
    try {
      const newResponse = await fetch(`${API_URL}/orders?status=new`);
      const preparingResponse = await fetch(`${API_URL}/orders?status=preparing`);

      const newOrders = await newResponse.json();
      const preparingOrders = await preparingResponse.json();

      setEmployeeOrders([...newOrders, ...preparingOrders]);
    } catch (error) {
      setEmployeeError("Could not load employee orders");
    }
  }

  async function loadDeliveryOrders() {
    try {
      const response = await fetch(`${API_URL}/orders?status=ready`);
      const data = await response.json();
      setDeliveryOrders(data);
    } catch (error) {
      setDeliveryError("Could not load delivery orders");
    }
  }

  function getPizzaById(id) {
    return menu.pizzas.find((pizza) => pizza.id === id);
  }

  function getSizeById(id) {
    return menu.sizes.find((size) => size.id === id);
  }

  function getToppingById(id) {
    return menu.toppings.find((topping) => topping.id === id);
  }

  function toggleTopping(toppingId) {
    if (selectedToppings.includes(toppingId)) {
      setSelectedToppings(selectedToppings.filter((id) => id !== toppingId));
      return;
    }

    if (selectedToppings.length >= 3) {
      alert("You can choose up to 3 toppings for each pizza");
      return;
    }

    setSelectedToppings([...selectedToppings, toppingId]);
  }

  function addPizzaToCart() {
    const newItem = {
      pizzaId: selectedPizza,
      sizeId: selectedSize,
      toppingIds: selectedToppings
    };

    setCart([...cart, newItem]);
    setSelectedToppings([]);
  }

  function removeFromCart(indexToRemove) {
    setCart(cart.filter((item, index) => index !== indexToRemove));
  }

  function calculateEstimatedPrice() {
    if (!menu) {
      return 0;
    }

    let total = 0;

    for (const item of cart) {
      const pizza = getPizzaById(item.pizzaId);
      const size = getSizeById(item.sizeId);

      let itemPrice = pizza.price + size.price;

      for (const toppingId of item.toppingIds) {
        const topping = getToppingById(toppingId);
        itemPrice += topping.price;
      }

      total += itemPrice;
    }

    return total;
  }

  async function checkout() {
    setCustomerError("");
    setConfirmation(null);

    const orderData = {
      customerName,
      phone,
      deliveryAddress,
      pizzas: cart
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        setCustomerError(data.error || "Order failed");
        return;
      }

      setConfirmation(data);
      setCart([]);
      setCustomerName("");
      setPhone("");
      setDeliveryAddress("");

      loadEmployeeOrders();
      loadDeliveryOrders();
    } catch (error) {
      setCustomerError("Could not send order to server");
    }
  }

  async function searchOrder() {
    setSearchError("");
    setSearchedOrder(null);

    try {
      const response = await fetch(`${API_URL}/orders/${searchId}`);
      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.error || "Order not found");
        return;
      }

      setSearchedOrder(data);
    } catch (error) {
      setSearchError("Could not search order");
    }
  }

  async function updateOrderStatus(orderId, newStatus, role) {
    setEmployeeError("");
    setDeliveryError("");

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        if (role === "employee") {
          setEmployeeError(data.error || "Status update failed");
        } else {
          setDeliveryError(data.error || "Status update failed");
        }
        return;
      }

      loadEmployeeOrders();
      loadDeliveryOrders();

      if (searchedOrder && searchedOrder.id === orderId) {
        setSearchedOrder(data);
      }
    } catch (error) {
      if (role === "employee") {
        setEmployeeError("Could not update order status");
      } else {
        setDeliveryError("Could not update order status");
      }
    }
  }

  function renderPizzaText(item) {
    if (!menu) {
      return "";
    }

    const pizza = getPizzaById(item.pizzaId);
    const size = getSizeById(item.sizeId);

    const toppingNames = item.toppingIds
      .map((id) => getToppingById(id).name)
      .join(", ");

    return `${pizza.name} - ${size.name}${toppingNames ? " - " + toppingNames : ""}`;
  }

  function renderOrderItems(order) {
    return order.pizzas.map((item, index) => (
      <li key={index}>
        {item.pizzaName} - {item.sizeName}
        {item.toppings.length > 0 && (
          <span>
            {" "}with {item.toppings.map((topping) => topping.name).join(", ")}
          </span>
        )}
        {" "}({item.itemPrice} ₪)
      </li>
    ));
  }

  if (!menu) {
    return <div className="app">Loading menu...</div>;
  }

  return (
    <div className="app">
      <h1>Pizza Order System</h1>

      <section className="card">
        <h2>Customer Screen</h2>

        <div data-testid="menu-list">
          <h3>Menu</h3>

          <div className="menu-box">
            <h4>Pizzas</h4>
            {menu.pizzas.map((pizza) => (
              <p key={pizza.id}>
                {pizza.name} - {pizza.price} ₪
              </p>
            ))}

            <h4>Sizes</h4>
            {menu.sizes.map((size) => (
              <p key={size.id}>
                {size.name} - {size.price} ₪
              </p>
            ))}

            <h4>Toppings</h4>
            {menu.toppings.map((topping) => (
              <p key={topping.id}>
                {topping.name} - {topping.price} ₪
              </p>
            ))}
          </div>
        </div>

        <h3>Build Pizza</h3>

        <label>
          Pizza:
          <select value={selectedPizza} onChange={(e) => setSelectedPizza(e.target.value)}>
            {menu.pizzas.map((pizza) => (
              <option key={pizza.id} value={pizza.id}>
                {pizza.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Size:
          <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
            {menu.sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p>Toppings:</p>
          {menu.toppings.map((topping) => (
            <label key={topping.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedToppings.includes(topping.id)}
                onChange={() => toggleTopping(topping.id)}
              />
              {topping.name}
            </label>
          ))}
        </div>

        <button onClick={addPizzaToCart}>Add Pizza To Cart</button>

        <div data-testid="cart" className="cart">
          <h3>Cart</h3>

          {cart.length === 0 && <p>No pizzas in cart</p>}

          {cart.map((item, index) => (
            <div key={index} className="cart-item">
              <span>{renderPizzaText(item)}</span>
              <button onClick={() => removeFromCart(index)}>Remove</button>
            </div>
          ))}
        </div>

        <div data-testid="order-summary-panel" className="summary">
          <h3>Order Summary</h3>
          <p>Number of pizzas: {cart.length}</p>
          <p>Estimated price: {calculateEstimatedPrice()} ₪</p>
          <p className="note">Final price is calculated by the server.</p>
        </div>

        <h3>Customer Details</h3>

        <input
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Delivery address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
        />

        <button data-testid="checkout-button" onClick={checkout}>
          Fake Payment And Create Order
        </button>

        {customerError && <p className="error">{customerError}</p>}

        {confirmation && (
          <div data-testid="order-confirmation" className="success">
            <h3>Order Confirmed</h3>
            <p>Order number: {confirmation.id}</p>
            <p>Status: {confirmation.status}</p>
            <p>Payment status: {confirmation.paymentStatus}</p>
            <p>Total price from server: {confirmation.totalPrice} ₪</p>
          </div>
        )}

        <h3>Track Order</h3>

        <input
          placeholder="Enter order id"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />

        <button onClick={searchOrder}>Check Status</button>

        {searchError && <p className="error">{searchError}</p>}

        {searchedOrder && (
          <div className="success">
            <p>Order ID: {searchedOrder.id}</p>
            <p>Status: {searchedOrder.status}</p>
            <p>Total price: {searchedOrder.totalPrice} ₪</p>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Restaurant Employee Screen</h2>

        {employeeError && <p className="error">{employeeError}</p>}

        <div data-testid="employee-orders">
          {employeeOrders.length === 0 && <p>No active orders</p>}

          {employeeOrders.map((order) => (
            <div key={order.id} className="order-card">
              <h3>Order #{order.id}</h3>
              <p>Customer: {order.customerName}</p>
              <p>Phone: {order.phone}</p>
              <p>Status: {order.status}</p>
              <p>Total price: {order.totalPrice} ₪</p>

              <ul>{renderOrderItems(order)}</ul>

              {order.status === "new" && (
                <button onClick={() => updateOrderStatus(order.id, "preparing", "employee")}>
                  Move To Preparing
                </button>
              )}

              {order.status === "preparing" && (
                <button onClick={() => updateOrderStatus(order.id, "ready", "employee")}>
                  Move To Ready
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Delivery Screen</h2>

        {deliveryError && <p className="error">{deliveryError}</p>}

        <div data-testid="delivery-orders">
          {deliveryOrders.length === 0 && <p>No ready orders for delivery</p>}

          {deliveryOrders.map((order) => (
            <div key={order.id} className="order-card">
              <h3>Order #{order.id}</h3>
              <p>Customer: {order.customerName}</p>
              <p>Phone: {order.phone}</p>
              <p>Address: {order.deliveryAddress}</p>
              <p>Status: {order.status}</p>

              <button onClick={() => updateOrderStatus(order.id, "delivered", "delivery")}>
                Mark As Delivered
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;