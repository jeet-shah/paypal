import db from "./config";
import { createRequire } from "module";
const require = createRequire(import.meta.url)
const express = require("express");
const bodypareser = require("body-parser");
const engines = require("consolidate");
const paypal = require("paypal-rest-sdk");

const app = express();

app.engine("ejs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodypareser.json());
app.use(bodypareser.urlencoded({extended:true}));
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AeQ9P9PydfTrfqh_V_dnrmB0WCIiEWGsZePZQ3xa3_zC-EcQKDCyBu9I-AVPycdxjQF6IxVtz8jWt8mX',
    'client_secret': 'EGvBr_9XBOL_OF7S2Dg-cG-l1AfNt3o9h5Zh1sFjLkIgkAhK-7xZDbT98ljeSv3x7VnfoZ_56DhWrTE-'
  });

app.get("/", (req,res) => {
    res.render('index')
});

async function totalprice(Price){
    const PriceCollection = db.collection('Cart').where('PaymentStatus',"==","Pending")
    const Snapshot = PriceCollection.get()
    Snapshot.docs.map(doc => {
        Price = doc.data().TotalPrice
    })
    Price = 545/73.61
}

app.get('/paypal', (req,res) => {
    var Price = 0
    totalprice(Price)
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://192.168.1.106:3000/success",
            "cancel_url": "http://192.168.1.106:3000/cancel"
        },
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": Price
            },
        }]
    };
    
    
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            console.log("Create Payment Response");
            console.log(payment);
            res.redirect(payment.links[1].href)
        }
    });
});

app.get('/success', (req, res) => {

    var payerID = req.query.PayerID;

    var paymentID = req.query.paymentId

    var execute_payment_json = {
        "payer_id": payerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1.00"
            }
        }]
    };
    
    paypal.payment.execute(paymentID, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));
            res.render('success')
        }
    });
});

app.get('/cancel', (req, res) => {
    res.render("cancel");
});

app.listen(3000, () => {
    console.log("Server Is Running");
});