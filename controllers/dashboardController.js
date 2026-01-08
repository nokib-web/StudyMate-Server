const { getCollection } = require("../config/db");
const { ObjectId } = require('mongodb');

const getDashboardStats = async (req, res) => {
    try {
        const { email } = req.params;
        const connectionsCollection = getCollection("connections");
        const sessionsCollection = getCollection("study_sessions");

        // 1. Partner and Connection stats
        const connectionsPromise = connectionsCollection.countDocuments({ senderEmail: email });
        const partnersPromise = connectionsCollection.find({ senderEmail: email }).toArray();

        // 2. Total Sessions Joined
        const sessionsJoinedPromise = sessionsCollection.countDocuments({ participants: email });

        // 3. Aggregate Work: Study Hours, Activity Data, and Streak
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setHours(0, 0, 0, 0);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const aggregationPromise = sessionsCollection.aggregate([
            { $match: { participants: email } },
            {
                $facet: {
                    totalStats: [
                        {
                            $group: {
                                _id: null,
                                totalMinutes: { $sum: { $ifNull: ["$duration", 0] } }
                            }
                        }
                    ],
                    activityData: [
                        { $match: { startTime: { $gte: sevenDaysAgo } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
                                totalMinutes: { $sum: { $ifNull: ["$duration", 0] } }
                            }
                        }
                    ],
                    recentSessionsCount: [
                        { $match: { startTime: { $gte: fiveDaysAgo } } },
                        { $count: "count" }
                    ]
                }
            }
        ]).toArray();

        const [
            connections,
            partners,
            sessionsJoined,
            [aggResults]
        ] = await Promise.all([
            connectionsPromise,
            partnersPromise,
            sessionsJoinedPromise,
            aggregationPromise
        ]);

        // Process Total Hours
        const totalMinutes = aggResults.totalStats[0]?.totalMinutes || 0;
        const studyHours = (totalMinutes / 60).toFixed(1);

        // Process Streak
        const streak = aggResults.recentSessionsCount[0]?.count || 0;

        // Process Activity Data (fill gaps)
        const activityData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            const match = aggResults.activityData.find(d => d._id === dateStr);
            activityData.push({
                name: dayName,
                hours: match ? parseFloat((match.totalMinutes / 60).toFixed(1)) : 0
            });
        }

        // Subject Distribution
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
