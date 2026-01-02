const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getBlogsCollection = () => getCollection("blogs");

// Get all blogs with optional category filter
const getBlogs = async (req, res) => {
    try {
        const blogsCollection = getBlogsCollection();
        const category = req.query.category;
        const query = {};

        if (category) {
            query.category = category;
        }

        const cursor = blogsCollection.find(query).sort({ createdAt: -1 });
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch blogs" });
    }
};

// Get single blog by ID
const getBlogById = async (req, res) => {
    try {
        const blogsCollection = getBlogsCollection();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await blogsCollection.findOne(query);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch blog details" });
    }
};

// Create a blog (For testing/seeding mainly, or admin)
const createBlog = async (req, res) => {
    try {
        const blogsCollection = getBlogsCollection();
        const blog = req.body;
        blog.createdAt = new Date();
        const result = await blogsCollection.insertOne(blog);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to create blog" });
    }
};

// Update a blog
const updateBlog = async (req, res) => {
    try {
        const blogsCollection = getBlogsCollection();
        const id = req.params.id;
        const updatedBlog = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                ...updatedBlog
            }
        };
        const result = await blogsCollection.updateOne(filter, updateDoc);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update blog" });
    }
};

// Delete a blog
const deleteBlog = async (req, res) => {
    try {
        const blogsCollection = getBlogsCollection();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await blogsCollection.deleteOne(query);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to delete blog" });
    }
};

module.exports = {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog
};
