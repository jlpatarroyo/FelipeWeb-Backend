const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    name: {type: String, unique: true},
    description: String,
    date: Date
});

module.exports = mongoose.model('Project', projectSchema, "projects");