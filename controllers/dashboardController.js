const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getDashboardStats = async (req, res) => {
    try {
        const { email } = req.params;
        const connectionsCollection = getCollection("connections");
        const sessionsCollection = getCollection("study_sessions");
        const blogsCollection = getCollection("blogs");
        const usersCollection = getCollection("users");

        // 1. Partner Count
        // Connections where user is sender or receiver (if receiver logic exists)
        // Currently connectionController only searches senderEmail
        const connections = await connectionsCollection.countDocuments({ senderEmail: email });

        // 2. Study Sessions Count (Goals Met)
        const sessionsJoined = await sessionsCollection.countDocuments({ participants: email });

        // 3. Study Hours (Sum of durations of joined sessions)
        const sessions = await sessionsCollection.find({ participants: email }).toArray();
        const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const studyHours = (totalMinutes / 60).toFixed(1);

        // 4. Streak (Dummy for now or calculated from sessions)
        // Let's assume streak is count of sessions in last 5 days
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const recentSessions = await sessionsCollection.countDocuments({
            participants: email,
            startTime: { $gte: fiveDaysAgo }
        });
        const streak = recentSessions > 0 ? recentSessions : 0;

        // 5. Activity data (Last 7 days breakdown)
        const activityData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const dailySessions = await sessionsCollection.find({
                participants: email,
                startTime: { $gte: startOfDay, $lte: endOfDay }
            }).toArray();

            const dailyMinutes = dailySessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
            activityData.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                hours: parseFloat((dailyMinutes / 60).toFixed(1))
            });
        }

        // 6. Subject Distribution
        // Group sessions by subject
        // We need to know which subject the session belongs to. 
        // Currently session model only has 'topic'. 
        // Let's try to infer or just use mock for this if not available.
        // Actually, let's use the user's partners' subjects as "Focus Areas"
        const partners = await connectionsCollection.find({ senderEmail: email }).toArray();
        const subjectCounts = {};
        partners.forEach(p => {
            if (p.subject) {
                subjectCounts[p.subject] = (subjectCounts[p.subject] || 0) + 1;
            }
        });

        const subjectData = Object.keys(subjectCounts).map(subject => ({
            name: subject,
            value: subjectCounts[subject]
        }));

        // Default if empty
        if (subjectData.length === 0) {
            subjectData.push({ name: 'General', value: 1 });
        }

        res.send({
            stats: {
                studyHours,
                partners: connections,
                goalsMet: sessionsJoined,
                streak
            },
            activityData,
            subjectData
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).send({ message: "Internal server error" });
    }
};

module.exports = { getDashboardStats };
