const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getReviewsCollection = () => getCollection("reviews");

// Get Reviews by Partner ID
const getReviewsByPartnerId = async (req, res) => {
    try {
        const reviewsCollection = getReviewsCollection();
        const partnerId = req.params.partnerId;
        const query = { partnerId: partnerId };
        const cursor = reviewsCollection.find(query).sort({ createdAt: -1 });
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch reviews" });
    }
};

// Add a Review
const addReview = async (req, res) => {
    try {
        const reviewsCollection = getReviewsCollection();
        const review = req.body;

        // Basic validation
        if (!review.partnerId || !review.rating || !review.reviewerName) {
            return res.status(400).send({ message: "Missing required fields" });
        }

        review.createdAt = new Date();
        const result = await reviewsCollection.insertOne(review);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to add review" });
    }
};

module.exports = {
    getReviewsByPartnerId,
    addReview
};
