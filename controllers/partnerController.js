const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getPartnersCollection = () => getCollection("partners");

// Get all partners
const getPartners = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const partnersCollection = getPartnersCollection();
        const query = {};
        const email = req.query.email;
        if (email) {
            query.email = email;
        }

        const total = await partnersCollection.countDocuments(query);
        const partners = await partnersCollection.find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        res.send({
            partners,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch partners" });
    }
};

// Get Top Partners
const getTopPartners = async (req, res) => {
    const partnersCollection = getPartnersCollection();
    const cursor = partnersCollection.find()
        .sort({ rating: -1 })
        .limit(3);
    const result = await cursor.toArray();
    res.send(result);
};

// Get Single Partner
const getPartnerById = async (req, res) => {
    const partnersCollection = getPartnersCollection();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await partnersCollection.findOne(query);
    res.send(result);
};

// Create Partner
const createPartner = async (req, res) => {
    const partnersCollection = getPartnersCollection();
    const newPartner = req.body;

    // Server-side validation
    if (!newPartner.name || !newPartner.email || !newPartner.availabilityTime || !newPartner.subject) {
        return res.status(400).send({ message: "Missing required fields (name, email, availabilityTime, subject)" });
    }

    // Check if partner with this email already exists
    const existingPartner = await partnersCollection.findOne({ email: newPartner.email });
    if (existingPartner) {
        return res.status(409).send({ message: "A partner profile with this email already exists." });
    }

    const result = await partnersCollection.insertOne(newPartner);
    res.send(result);
};

// Update Partner (Increment count)
const updatePartnerCount = async (req, res) => {
    const partnersCollection = getPartnersCollection();
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
};

// Delete Partner
const deletePartner = async (req, res) => {
    const partnersCollection = getPartnersCollection();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await partnersCollection.deleteOne(query);
    res.send(result);
};

// Get Category Stats
const getCategoryStats = async (req, res) => {
    try {
        const partnersCollection = getPartnersCollection();
        const pipeline = [
            {
                $group: {
                    _id: "$subject",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    subject: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ];
        const result = await partnersCollection.aggregate(pipeline).toArray();
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch category stats" });
    }
};

module.exports = {
    getPartners,
    getTopPartners,
    getPartnerById,
    createPartner,
    updatePartnerCount,
    deletePartner,
    getCategoryStats
};
