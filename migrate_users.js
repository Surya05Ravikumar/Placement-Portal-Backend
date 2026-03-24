const mongoose = require('mongoose');
const User = require('./models/User');

async function migrate() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect('mongodb://127.0.0.1:27017/placement_portal');
        console.log("Connected.");

        // Migration step 1: Set defaults for missing gender and dateOfBirth
        const defaultUpdate = await User.updateMany(
            { $or: [ { gender: { $exists: false } }, { dateOfBirth: { $exists: false } } ] },
            { 
                $set: { 
                    gender: "Male",
                    dateOfBirth: new Date("2002-01-01")
                } 
            }
        );
        console.log(`Defaults set: ${defaultUpdate.modifiedCount}`);

        // Migration step 2: Remove address field
        const unsetResult = await User.updateMany(
            {},
            { $unset: { address: "" } }
        );
        console.log(`Address unset: ${unsetResult.modifiedCount}`);

        console.log(`Migration complete.`);

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

migrate();
