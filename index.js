const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const SSLCommerzPayment = require("sslcommerz-lts");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const corsOption = {
  origin: ["http://localhost:5175", "http://localhost:5174"],
};
app.use(express.json());
app.use(cors(corsOption));

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.knd5cf7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const store_id = process.env.STORD_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false; //true for live, false for sandbox

async function run() {
  try {
    await client.connect();

    const payment = client.db("SSLCommers").collection("payment");

    app.post("/create-payment", async (req, res) => {
      const { email, card_holder, billing_address, billing_state, currentPrice } = req.body;
      const transaction = new ObjectId().toString();

      const saveData = {
        email,
        card_holder,
        billing_address,
        billing_state,
        currentPrice,
        transaction,
        status: "panding",
      };
    

      const data = {
        total_amount: currentPrice,
        currency: billing_state,
        tran_id: transaction, // use unique tran_id for each api call
        success_url: `http://localhost:500/success-payment/${transaction}`,
        fail_url: "http://localhost:500/fail",
        cancel_url: "http://localhost:500/calcal",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: card_holder,
        cus_email: email,
        cus_add1: billing_address,
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      const result = await payment.insertOne(saveData);
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        let GatewayPageURL = apiResponse.GatewayPageURL;
        if (result) {
          res.send({ url: GatewayPageURL });
        }
      });

      app.post("/success-payment/:trant", async (req, res) => {
        const successData = req.params.trant;
        const query = {transaction : successData};
        const updateData = await payment.updateOne(query,{
            $set:{
                status: "success",
            }
        })
        res.redirect('http://localhost:5174/success')
      });


      app.post('/calcal',async (req,res)=> {
           res.redirect('http://localhost:5174/cancel')
      })
      app.post('/fail',async (req,res)=> {
           res.redirect('http://localhost:5174/fail')
      })







    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Hallo SSLCOMMERS server side ");
});

app.listen(port, () => {
  console.log(`server side is start now and all right welcome to my page `);
});
