require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User"); // Adjust the path as needed

async function deleteUsers() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected successfully.");

        console.log("Deleting all users...");
        const result = await User.deleteMany({});
        console.log(`${result.deletedCount} users were deleted.`);

        console.log("Disconnecting from MongoDB.");
        await mongoose.disconnect();
        process.exit();

    } catch (err) {
        console.error("Error deleting users:", err);
        process.exit(1);
    }
}

deleteUsers();