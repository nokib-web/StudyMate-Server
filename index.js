const express = require('express')
const cors = require('cors')
require('dotenv').config();
const app = express()
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        const db = client.db("StudyMateDB");
        const partnersCollection = db.collection("partners");
        const connectionsCollection = db.collection("connections");

        // partners related api
        // Get all partners
        app.get('/partners', async (req, res) => {

            const query = {};

            const cursor = partnersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get a single partner by ID
        app.get('/partners/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await partnersCollection.findOne(query);
            res.send(result);
        });

        // Add a new partner
        app.post('/partners', async (req, res) => {
            const newPartner = req.body;
            console.log(newPartner);
            const result = await partnersCollection.insertOne(newPartner);
            res.send(result);
        });


        // Update partner information
        app.patch('/partners/:id', async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: updateData,
            };

            const result = await partnersCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        // connections related api
        app.post('/connections', async (req, res) => {
            const request = req.body;
            const result = await connectionsCollection.insertOne(request);
            res.send(result);
        });


       
        // Get connections by sender email
        app.get('/connections/:email', async (req, res) => {
            const email = req.params.email;
            const query = { senderEmail: email }; 
            const cursor = connectionsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // Delete a connection
        app.delete('/connections/:id', async (req, res) => {
            const id = req.params.id;
            const result = await connectionsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Update a connection
        app.put('/connections/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await connectionsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
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
