"use strict";

/**
 * Required modules
 */

const express = require("express");
const path = require("path");
const { mongoclient } = require("mongodb");
const fs = require("fs");
const mongoose = require("mongoose");
const Project = require("./models/Project");
const Category = require("./models/Category");
const moment = require("moment");

/**
 * Data files
 */

let mongo_raw = fs.readFileSync("./data/mongo-credentials.json");
let mdb_cred = JSON.parse(mongo_raw);
const uri = `mongodb://${mdb_cred.dbuser}:${mdb_cred.dbpassword}@${mdb_cred.url}`;

/**
 * App variables
 */

const app = express();
const port = process.env.PORT || "8000";
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const db = mongoose.connection;

/**
 * Test db connection with Mongoose
 */
mongoose.connect(uri, { useNewUrlParser: true });
db.once("open", (_) => {
  console.log("Database connected!");
});

db.on("error", (err) => {
  console.error("Connection error: ", err);
});

/**
 * Routes definitions
 */

app.get("/", (req, res) => {
  res.status(200).send("Hello: hello");
});

app.post("/projects", (req, res) => {
  var formatted_date = moment(req.body.date);
  var name = req.body.name;
  const project = {
    name: req.body.name,
    description: req.body.description,
    date: formatted_date
  }
  saveProject(project)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        "Error": "Error posting project " + project,
      });
    });
});

app.get("/projects", (req, res) => {
  getProjects()
    .then((projects) => {
      res.send(projects);
    })
    .catch((error) => {
      res.send({
        "Error": "Could not retrieve projects",
      });
    });
});

app.get("/projects/:name", (req, res) => {
  const name = req.params.name;
  getProject(returnSpaces(name))
    .then((project) => {
      res.send(project);
    })
    .catch((error) => {
      res.send({
        "Error": "Couldn't retrieve project with name " + name,
      });
    });
});

app.delete("/projects/:name", (req, res) => {
  const name = req.params.name;
  deleteProject(returnSpaces(name))
  .then((doc) => {
    res.send(doc);
  })
  .catch((error) => {
    res.send({
      "Error":"Error deleting project with name " + name
    })
  })
});

app.get("/categories", (req, res) => {
  getCategories()
    .then((projects) => {
      res.send(projects);
    })
    .catch((error) => {
      res.send({
        "Error": "Error retrieving categories",
      });
    });
});

app.get("/categories/:name", (req, res) => {
  const name = req.params.name;
  getCategory(name)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        "Error": "Error retrieving category with name " + name,
      });
    });
});

app.post("/categories", (req, res) => {
  const category = {
    name: req.body.name,
    description: req.body.description
  }
  saveCategory(category)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        "Error": "Couldn't post category " + category,
      });
    });
});

app.delete("/categories/:name", (req,res) =>{
  const name = req.params.name;
  deleteCategory(returnSpaces(name))
  .then((doc) => {
    res.send(doc);
  })
  .catch((error) => {
    res.send({
      "Error":"Error deleting category with name " + name 
    })
  });
});

/**
 * Functions
 */

async function saveProject(project) {
  const p = new Project(project);
  const doc = await p.save();
  return doc;
}

async function getProjects() {
  const projects = await Project.find();
  return projects;
}

async function getProject(name) {
  const project = await Project.findOne({ name: name });
  return project;
}

async function deleteProject(name){
  const project = await Project.findOne({name:name});
  const deleted = await project.remove();
  return deleted;
}

async function getCategories() {
  const categories = await Category.find();
  return categories;
}

async function saveCategory(category) {
  const c = new Category(category);
  const doc = await c.save();
  return doc;
}

async function getCategory(name) {
  const category = Category.findOne({
    name: name,
  });
  return category;
}

async function deleteCategory(name){
  const category = await Category.findOne({name:name});
  const doc = await category.remove();
  return doc;
}

function returnSpaces(str) {
  return str.replace("_", " ");
}

/**
 * Server activation
 */

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
