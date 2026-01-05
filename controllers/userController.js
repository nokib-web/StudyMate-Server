const { getCollection } = require("../config/db");

// Helper to get collection
const getUsersCollection = () => getCollection("users");

// Create User
const createUser = async (req, res) => {
    const usersCollection = getUsersCollection();
    const newUser = req.body;
    // set role if provided, else default to student
    if (!newUser.role) {
        newUser.role = 'student';
    }

    const email = req.body.email;
    const query = { email: email }
    const existingUser = await usersCollection.findOne(query);

    if (existingUser) {
        // Fix: If user exists but has NO role (legacy user), update it
        if (!existingUser.role) {
            const roleToSet = newUser.role || 'student';
            await usersCollection.updateOne(
                { email: email },
                { $set: { role: roleToSet } }
            );
            res.send({ message: 'User role updated', insertedId: existingUser._id });
        } else {
            res.send({ message: 'user already exits. do not need to insert again' })
        }
    }
    else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
    }
};

// Get User by Email
const getUserByEmail = async (req, res) => {
    const usersCollection = getUsersCollection();
    const email = req.params.email;
    const query = { email: email };
    const result = await usersCollection.findOne(query);
    res.send(result);
};

// Update User
const updateUser = async (req, res) => {
    const usersCollection = getUsersCollection();
    const email = req.params.email;
    const update = req.body;
    const result = await usersCollection.updateOne(
        { email },
        { $set: { name: update.name, image: update.image } },
        { upsert: true }
    );
    res.send(result);
};

// Check if user is Admin
const getAdmin = async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await getUsersCollection().findOne(query);
    let isAdmin = false;
    if (user) {
        isAdmin = user?.role === 'admin';
    }
    res.send({ admin: isAdmin });
}

// Get ALL users (Admin only ideally)
const getAllUsers = async (req, res) => {
    const result = await getUsersCollection().find().toArray();
    res.send(result);
};

// Update User Role (Admin only)
const updateUserRole = async (req, res) => {
    const id = req.params.id;
    const { role } = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: { role: role }
    };
    const result = await getUsersCollection().updateOne(filter, updateDoc);
    res.send(result);
};

const getPublicStats = async (req, res) => {
    try {
        const usersCount = await getUsersCollection().countDocuments();
        const sessionsCount = await getCollection("study_sessions").countDocuments();
        const partnersCount = await getCollection("partners").countDocuments();
        const reviewsCount = await getCollection("reviews").countDocuments();

        res.send({
            users: usersCount,
            sessions: sessionsCount,
            partners: partnersCount,
            reviews: reviewsCount
        });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch stats" });
    }
};

module.exports = { createUser, getUserByEmail, updateUser, getAdmin, getAllUsers, updateUserRole, getPublicStats };
