const { getCollection } = require("../config/db");
const { ObjectId } = require("mongodb");

const createStory = async (req, res) => {
    try {
        const story = req.body;
        const result = await getCollection("success_stories").insertOne({
            ...story,
            createdAt: new Date()
        });
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to create story" });
    }
};

const getStories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const collection = getCollection("success_stories");
        const total = await collection.countDocuments();
        const stories = await collection.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        res.send({
            stories,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch stories" });
    }
};

const deleteStory = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await getCollection("success_stories").deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to delete story" });
    }
};

module.exports = { createStory, getStories, deleteStory };
