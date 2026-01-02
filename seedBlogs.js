const { MongoClient } = require("mongodb");
require('dotenv').config({ path: './.env' });

const uri = process.env.DB_URI;
const client = new MongoClient(uri);

const blogs = [
    {
        title: "5 Tips to Find the Perfect Study Partner",
        excerpt: "Finding someone who matches your study style is crucial. Here are key things to look for in a potential study buddy to ensure a productive collaboration.",
        content: "Finding someone who matches your study style is crucial. Here are key things to look for in a potential study buddy to ensure a productive collaboration.\n\n1. Complementary Skills: Look for someone who is strong in areas where you might be weak.\n2. Similar Goals: Ensure you are both aiming for similar grades or learning outcomes.\n3. Compatible Schedule: You need to be able to meet at times that work for both of you.\n4. Communication Style: Make sure you can communicate openly and honestly.\n5. Commitment Level: Find someone who is as dedicated to the course as you are.",
        category: "Tips",
        image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800",
        author: "Sarah J.",
        createdAt: new Date()
    },
    {
        title: "How to Stay Motivated During Exam Season",
        excerpt: "Burnout is real. Discover strategies to keep your energy high and stress low during finals week.",
        content: "Burnout is real. Discover strategies to keep your energy high and stress low during finals week.\n\nIt's easy to feel overwhelmed, but taking small breaks, staying hydrated, and getting enough sleep are non-negotiables. Remember to reward yourself for small milestones.",
        category: "Wellness",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800",
        author: "Mike T.",
        createdAt: new Date()
    },
    {
        title: "Top Tools for Remote Study Sessions",
        excerpt: "From whiteboards to timers, these digital tools will take your collaboration to the next level.",
        content: "From whiteboards to timers, these digital tools will take your collaboration to the next level.\n\nCheck out tools like Miro for whiteboarding, Pomotroid for timing, and of course, StudyMate for finding partners!",
        category: "Tech",
        image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800",
        author: "Admin",
        createdAt: new Date()
    }
];

async function run() {
    try {
        await client.connect();
        const database = client.db("studyMateDB");
        const collection = database.collection("blogs");

        const count = await collection.countDocuments();
        if (count === 0) {
            const result = await collection.insertMany(blogs);
            console.log(`${result.insertedCount} blogs inserted.`);
        } else {
            console.log("Blogs already exist, skipping seed.");
        }
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
