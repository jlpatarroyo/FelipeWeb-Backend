const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name:{type: String, unique:true},
    description:String
});

module.exports = mongoose.model('Category', categorySchema, "categories");