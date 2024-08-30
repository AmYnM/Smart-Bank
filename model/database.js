const mongoose = require('mongoose');

const databaseSchema = new mongoose.Schema({
   address: {
    type: String,
    required: true,
    unique: true
   },
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    initialSupply: {
        type: Number,
        requierd: true
    }
});

module.exports = mongoose.model('Database', databaseSchema);
