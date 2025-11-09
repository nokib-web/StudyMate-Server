const express = require('express')
const cors = require('cors')
require('dotenv').config();
const app = express()
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000


// middle
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9bjil3c.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});




app.get('/', (req, res) => {
    res.send('Hello World!')
})

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const  db = client.db("StudyMateDB");
        const partnersCollection = db.collection("partners");
        const connectionsCollection = db.collection("connections");

        app.get('/partners', async (req, res) => {


            const cursor = partnersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });


        app.post('/partners', async (req, res) => {
            const newPartner = req.body;
            console.log(newPartner);
            const result = await partnersCollection.insertOne(newPartner);
            res.send(result);
        });


        // connection related api
        app.get('/connections/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };
            const cursor = connectionsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
