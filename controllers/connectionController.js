const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getConnectionsCollection = () => getCollection("connections");

const createConnection = async (req, res) => {
    const connectionsCollection = getConnectionsCollection();
    const request = req.body;
    const result = await connectionsCollection.insertOne(request);
    res.send(result);
};

const getConnections = async (req, res) => {
    const connectionsCollection = getConnectionsCollection();
    const { email } = req.query;

    if (email !== req.token_email) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    const query = email ? { senderEmail: email } : {};
    const result = await connectionsCollection.find(query).toArray();
    res.send(result);
};

const deleteConnection = async (req, res) => {
    const connectionsCollection = getConnectionsCollection();
    const id = req.params.id;
    const result = await connectionsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
};

const updateConnection = async (req, res) => {
    const connectionsCollection = getConnectionsCollection();
    const id = req.params.id;
    const updatedData = req.body;
    const result = await connectionsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
    );
    res.send(result);
};

module.exports = { createConnection, getConnections, deleteConnection, updateConnection };
