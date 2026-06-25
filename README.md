# Pizza Order System

## Students

Student 1: Yafa Awad 
ID: 214048076

Student 2: TODO full name
ID: TODO student ID

Repository link: https://github.com/yafaawad2003-star/PIZZA_APP/tree/main

## AI Tool Used

We used ChatGPT to help us plan the project structure, write the initial server and client code, and prepare the README file. We reviewed and tested the code according to the assignment requirements.

## Development Environment

We used Visual Studio Code (VS Code) to write and edit the project code.

Server side: Node.js, Express, REST API
Client side: React with Vite
Data storage: In memory only, no database

## How to Run the Server

Open a terminal and run:

```bash
cd server
npm install
npm start
```

The server runs on:

```text
http://localhost:3001
```

The server uses the environment variable PORT. If PORT is not defined, it uses port 3001.

## How to Run the Client

Open another terminal and run:

```bash
cd client
npm install
npm run dev
```

The client runs on:

```text
http://localhost:5173
```

## Project Structure

```text
pizza_app_214048076
├── server
│   ├── package.json
│   └── src
│       └── server.js
├── client
│   ├── package.json
│   └── src
│       ├── App.jsx
│       ├── App.css
│       └── index.css
├── README.md
└── .gitignore
```

## Server Explanation

The server is the source of truth in the system. It stores the orders in memory, validates the order input, calculates the final price, and updates the order status.

The server supports these required routes:

```text
GET /api/menu
POST /api/orders
GET /api/orders/:id
GET /api/orders?status=<status>
PATCH /api/orders/:id/status
```

## Price Calculation

The total price is calculated on the server side only.

The client shows an estimated price to the user, but the final price is calculated again by the server using the menu prices and the selected pizza, size and toppings.

This is important because the server should not trust prices that come from the browser. A user can change data in the browser, so the correct and safe calculation must be done on the server.

## Personal Rule

The last digit of the submitting student's ID is 6.

Personal rule 6:

The same pizza in the same size cannot be ordered more than twice in the same order.

This rule is implemented on the server side in the function:

```text
validatePersonalRuleSix
```

The server checks all pizzas in the order before creating the order. If the same pizza with the same size appears more than two times, the server returns status code 400 with an error message.

## Changes From Exercise 1

We made small implementation changes from the original design in order to keep the system simple and suitable for the assignment.

The main change is that all data is saved in memory instead of using a database, because the assignment does not require a database. We also used one React page with different sections for the customer, restaurant employee and delivery person.

## Questions

### 1. What is the difference between the client side and the server side in our system?

The client side is the React interface that the users see and use. It displays the menu, cart, order form, employee screen and delivery screen.

The server side is the Node.js and Express application. It validates the data, calculates the final price, stores the orders in memory and controls the legal status transitions.

### 2. Where is the total price calculated and why?

The total price is calculated on the server side. This is done because the server should not trust data that comes from the client. The client can show an estimated price, but the final price must be calculated by the server.

### 3. What happens when a customer sends an invalid order?

The server checks the order. If required fields are missing, if there is no pizza, if a pizza id is invalid, if a size id is invalid, or if the toppings are invalid, the server returns status code 400 with an error message.

### 4. What happens after the fake payment succeeds?

After the fake payment succeeds, the client sends the order to the server. The server creates a new order, sets the payment status to paid, sets the order status to new, saves the order in memory and returns an order confirmation with the order id and final price.

### 5. What is the personal rule that applies to us?

The personal rule is rule 6: the same pizza in the same size cannot be ordered more than twice in the same order.

### 6. What was the most challenging part of the exercise?

The most challenging part was connecting the React client to the Express server and making sure that the order status updates happen only in the correct order.

### 7. What is one design decision you made and why?

We decided to keep the system simple and use one React page with separate sections for each role: customer, restaurant employee and delivery person. This makes the project easier to understand and still supports all required actions.

# PIZZA_APP
