const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if(!uri) {
            throw new Error('No MongoDB URI provided');
        }

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('Error Connecting to MongoDB:',error);
        process.exit(1);
    }
};

module.exports = connectDB;