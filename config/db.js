const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9bjil3c.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;

const connectDB = async () => {
    try {
        await client.connect();
        db = client.db("StudyMateDB");
        console.log("Successfully connected to MongoDB!");
        return db;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

const getDb = () => {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
};

const getCollection = (collectionName) => {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db.collection(collectionName);
};

module.exports = { connectDB, getDb, getCollection, client };
