const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Project = require('./Project');

const categorySchema = new Schema({
    name:{type: String, unique:true},
    description:String,
    projects:{type:[String], default:[]}
});

module.exports = mongoose.model('Category', categorySchema, "categories");