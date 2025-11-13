const express = require('express')
const cors = require('cors')
require('dotenv').config();
const app = express()
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 3000

// const serviceAccount = require('./StudyMate_SDK.json');
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middle
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://study-mate-server-nazmul-hasan-nokibs-projects.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));
app.options("*", cors({
    origin: [
        "http://localhost:5173",
        "https://study-mate-server-nazmul-hasan-nokibs-projects.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));

app.use(express.json())


const verifyFireBaseToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authorization.split(' ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        console.log('inside token', decoded)
        req.token_email = decoded.email;
        next();
    }
    catch (error) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
}



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
        const usersCollection = db.collection("users");




        // users related api
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const query = { email: email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                res.send({ message: 'user already exits. do not need to insert again' })
            }
            else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        })

        // get user by email
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            res.send(result);
        });

        // update user information
        app.put("/users/:email", async (req, res) => {
            const email = req.params.email;
            const update = req.body;
            const result = await usersCollection.updateOne(
                { email },
                { $set: { name: update.name, image: update.image } },
                { upsert: true }
            );
            res.send(result);
        });


        // partners related api
        // Get all partners
        app.get('/partners', async (req, res) => {

            const query = {};
            const email = req.query.email;
            if (email) {
                query.email = email;
            }

            const cursor = partnersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        // Get top partners with sorting and limiting
        app.get('/latest-products', async (req, res) => {
            const cursor = productsCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        // Get top 3 partners by rating
        app.get('/top-partners', async (req, res) => {
            const cursor = partnersCollection.find().sort({ rating: -1 }).limit(3);
            const result = await cursor.toArray();
            res.send(result);
        });


        // Get a single partner by ID
        app.get('/partners/:id', verifyFireBaseToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await partnersCollection.findOne(query);
            res.send(result);
        });

        // Add a new partner
        app.post('/partners', verifyFireBaseToken, async (req, res) => {
            const newPartner = req.body;
            console.log(newPartner);
            const result = await partnersCollection.insertOne(newPartner);
            res.send(result);
        });


        // Update partner information
        app.patch('/partners/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await partnersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { partnerCount: 1 } }
                );

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Failed to increment partner count' });
            }
        });

        // Delete a partner
        app.delete('/partners/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await partnersCollection.deleteOne(query);
            res.send(result);
        });



        // connections related api
        app.post('/connections', async (req, res) => {
            const request = req.body;
            const result = await connectionsCollection.insertOne(request);
            res.send(result);
        });



        // Get connections by sender email


        app.get('/connections', verifyFireBaseToken, async (req, res) => {
            const { email } = req.query;

            if (email !== req.token_email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = email ? { senderEmail: email } : {};
            const result = await connectionsCollection.find(query).toArray();
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
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
