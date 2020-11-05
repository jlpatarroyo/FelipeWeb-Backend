const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Category = require('./Category');

const projectSchema = new Schema({
  name: { type: String, unique: true },
  description: String,
  date: Date,
  categories: {type:[String], default:[]}
});

module.exports = mongoose.model("Project", projectSchema, "projects");
