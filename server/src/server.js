const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const menu = {
    pizzas: [
        { id: "margherita", name: "Margherita", price: 35 },
        { id: "vegetarian", name: "Vegetarian", price: 39 },
        { id: "pepperoni", name: "Pepperoni", price: 42 }
    ],
    sizes: [
        { id: "small", name: "Small", price: 0 },
        { id: "medium", name: "Medium", price: 8 },
        { id: "large", name: "Large", price: 15 }
    ],
    toppings: [
        { id: "olives", name: "Olives", price: 4 },
        { id: "mushrooms", name: "Mushrooms", price: 4 },
        { id: "corn", name: "Corn", price: 4 },
        { id: "onion", name: "Onion", price: 4.5 },
        { id: "extra_cheese", name: "Extra Cheese", price: 3.5 }
    ]
};

let orders = [];
let nextOrderNumber = 1;

const allowedStatuses = ["new", "preparing", "ready", "delivered"];

const nextStatus = {
    new: "preparing",
    preparing: "ready",
    ready: "delivered"
};

function findPizza(id) {
    return menu.pizzas.find((pizza) => pizza.id === id);
}

function findSize(id) {
    return menu.sizes.find((size) => size.id === id);
}

function findTopping(id) {
    return menu.toppings.find((topping) => topping.id === id);
}

function validateBasicOrder(body) {
    if (!body.customerName || !body.phone || !body.deliveryAddress) {
        return "Customer name, phone and delivery address are required";
    }

    if (!Array.isArray(body.pizzas) || body.pizzas.length === 0) {
        return "Order must contain at least one pizza";
    }

    return null;
}

function validatePersonalRuleSix(pizzas) {
    const counter = {};

    for (const pizza of pizzas) {
        const key = `${pizza.pizzaId}_${pizza.sizeId}`;
        counter[key] = (counter[key] || 0) + 1;

        if (counter[key] > 2) {
            return "Personal rule: the same pizza in the same size cannot be ordered more than twice";
        }
    }

    return null;
}

function buildPizzaDetails(pizzaRequest) {
    const pizza = findPizza(pizzaRequest.pizzaId);
    if (!pizza) {
        return { error: "Invalid pizza id" };
    }

    const size = findSize(pizzaRequest.sizeId);
    if (!size) {
        return { error: "Invalid size id" };
    }

    const toppingIds = pizzaRequest.toppingIds || [];

    if (!Array.isArray(toppingIds)) {
        return { error: "Toppings must be an array" };
    }

    if (toppingIds.length > 3) {
        return { error: "A pizza cannot have more than three toppings" };
    }

    const toppings = [];

    for (const toppingId of toppingIds) {
        const topping = findTopping(toppingId);

        if (!topping) {
            return { error: "Invalid topping id" };
        }

        toppings.push(topping);
    }

    const toppingsPrice = toppings.reduce((sum, topping) => sum + topping.price, 0);
    const itemPrice = pizza.price + size.price + toppingsPrice;

    return {
        item: {
            pizzaId: pizza.id,
            pizzaName: pizza.name,
            sizeId: size.id,
            sizeName: size.name,
            toppings: toppings,
            itemPrice: itemPrice
        }
    };
}

function createOrderItems(pizzas) {
    const items = [];

    for (const pizzaRequest of pizzas) {
        const result = buildPizzaDetails(pizzaRequest);

        if (result.error) {
            return { error: result.error };
        }

        items.push(result.item);
    }

    return { items };
}

function calculateTotalPrice(items) {
    return items.reduce((sum, item) => sum + item.itemPrice, 0);
}

app.get("/", (req, res) => {
    res.json({ message: "Pizza server is running" });
});

app.get("/api/menu", (req, res) => {
    res.status(200).json(menu);
});

app.post("/api/orders", (req, res) => {
    const basicError = validateBasicOrder(req.body);

    if (basicError) {
        return res.status(400).json({ error: basicError });
    }

    const personalRuleError = validatePersonalRuleSix(req.body.pizzas);

    if (personalRuleError) {
        return res.status(400).json({ error: personalRuleError });
    }

    const result = createOrderItems(req.body.pizzas);

    if (result.error) {
        return res.status(400).json({ error: result.error });
    }

    const totalPrice = calculateTotalPrice(result.items);

    const order = {
        id: String(nextOrderNumber),
        customerName: req.body.customerName,
        phone: req.body.phone,
        deliveryAddress: req.body.deliveryAddress,
        pizzas: result.items,
        totalPrice: totalPrice,
        status: "new",
        paymentStatus: "paid",
        createdAt: new Date().toISOString()
    };

    orders.push(order);
    nextOrderNumber++;

    res.status(201).json(order);
});

app.get("/api/orders", (req, res) => {
    const status = req.query.status;

    if (!status) {
        return res.status(200).json(orders);
    }

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    const filteredOrders = orders.filter((order) => order.status === status);
    res.status(200).json(filteredOrders);
});

app.get("/api/orders/:id", (req, res) => {
    const order = orders.find((order) => order.id === req.params.id);

    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
});

app.patch("/api/orders/:id/status", (req, res) => {
    const order = orders.find((order) => order.id === req.params.id);

    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    const newStatus = req.body.status;

    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    if (order.status === "delivered") {
        return res.status(409).json({ error: "Delivered order cannot be changed" });
    }

    if (nextStatus[order.status] !== newStatus) {
        return res.status(409).json({ error: "Illegal status transition" });
    }

    order.status = newStatus;

    res.status(200).json(order);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});