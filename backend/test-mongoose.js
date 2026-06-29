require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const userModel = require('./src/models/user.model');

async function run() {
    await mongoose.connect(process.env.MONGO_DB_URI);
    
    const user = await userModel.findOne({ $or: [{ username: undefined }, { email: 'test@example.com' }] });
    console.log("Found user with real email but undefined username:", user?.username);

    process.exit(0);
}

run();
