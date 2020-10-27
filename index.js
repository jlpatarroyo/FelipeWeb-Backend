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
  saveProject({
      name: req.body.name,
      description: req.body.description,
      date: formatted_date
  }).then(doc => {
      console.log("Posted project: ", doc);
      res.send(doc);
  }).catch(error => {
      console.log("Error posting project!");
      res.send({
          "error":"Error posting project"
      })
  });
});

/**
 * Functions
 */

 async function saveProject(project){
     const p = new Project(project);
     const doc = await p.save();
     return doc;
 }

/**
 * Server activation
 */

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
