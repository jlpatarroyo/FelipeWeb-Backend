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
const cors = require("cors");

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

var corsOptions = {
  origin: "http://localhost:4200",
  optionSucessStatus: 200,
};

app.use(cors(corsOptions));

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
    date: formatted_date,
    categories: req.body.categories,
  };
  saveProject(project)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error: "Error posting project " + project,
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
        Error: "Could not retrieve projects",
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
        Error: "Couldn't retrieve project with name " + name,
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
        Error: "Error deleting project with name " + name,
        Cause: error,
      });
    });
});

app.put("/projects/:name", (req, res, next) => {
  const new_project = {
    name: req.body.name,
    description: req.body.description,
    date: req.body.date,
    categories: req.body.categories,
  };
  const p_name = req.params.name;
  updateProject(returnSpaces(p_name), new_project)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error: "Error updating project with name " + new_project.name,
        Cause: error,
      });
    });
});

app.get("/projects/:name/categories", (req, res) => {
  const project_name = returnSpaces(req.params.name);
  getProjectCategories(project_name)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error:
          "Error retrieving project " +
          returnSpaces(project_name) +
          " categories",
        Cause: error,
      });
    });
});

app.post("/projects/:name/categories", (req, res, next) => {
  const new_category = {
    name: req.body.name,
    description: req.body.description,
  };
  const project_name = req.params.name;
  addCategoryToProject(returnSpaces(project_name), new_category)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error: "Error adding category to project " + returnSpaces(project_name),
        Cause: error,
      });
    });
});

app.delete("/projects/:project_name/categories/:category_name", (req, res) => {
  const project_name = returnSpaces(req.params.project_name);
  const category_name = returnSpaces(req.params.category_name);
  deleteCategoryFromProject(
    project_name,
    category_name
  )
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error:
          "Error deleting category '" +
          category_name +
          "' from project '" +
          project_name +
          "'",
        Cause: error,
      });
    });
  deleteProjectFromCategory(category_name, project_name)
  .then()
  .catch((error) => {
    console.log(error);
  });
});

app.get("/categories", (req, res) => {
  getCategories()
    .then((projects) => {
      res.send(projects);
    })
    .catch((error) => {
      res.send({
        Error: "Error retrieving categories",
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
        Error: "Error retrieving category with name " + name,
      });
    });
});

app.post("/categories", (req, res) => {
  const category = {
    name: req.body.name,
    description: req.body.description,
    projects: req.body.projects,
  };
  saveCategory(category)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error: "Couldn't post category " + category,
      });
    });
});

app.delete("/categories/:name", (req, res) => {
  const name = req.params.name;
  deleteCategory(returnSpaces(name))
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error: "Error deleting category with name " + name,
      });
    });
});

app.put("/categories/:name", (req, res, next) => {
  const new_category = {
    name: req.body.name,
    description: req.body.description,
  };
  const p_name = req.params.name;
  updateCategory(returnSpaces(p_name), new_category)
    .then((doc) => {
      res.send(doc);
    })
    .catch((error) => {
      res.send({
        Error: "Error updating category with name " + new_category.name,
      });
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

async function getProjectCategories(name) {
  const project = await Project.findOne({ name: name });
  const categories = project.categories;
  return categories;
}

async function deleteProject(name) {
  const project = await getProject(name);
  const deleted = await project.remove();
  return deleted;
}

async function addCategoryToProject(project_name, new_category) {
  const project = await getProject(project_name);
  const category = await getCategory(returnSpaces(new_category.name));
  if (project) {
    if (category) {
      const project_categories = project.categories;
      if (!hasKey(project_categories, category.name)) {
        project.categories.push(category.name);
        category.projects.push(project_name);
        await category.save();
      }
    } else {
      const _category = new Category(new_category);
      _category.projects.push(project_name);
      await _category.save();
      console.log(
        "Saving category " + new_category.name + " in project " + project_name
      );
      project.categories.push(_category.name);
    }
  }
  const doc = await project.save();
  return doc;
}

async function deleteCategoryFromProject(project_name, category_name) {
  const project = await getProject(project_name);
  if (project) {
    const project_categories = project.categories;
    if (hasKey(project_categories, category_name)) {
      const index = project_categories.indexOf(category_name);
      project_categories.splice(index, 1);
      project.categories = project_categories;
      const doc = await project.save();
      return doc;
    }
  }
  throw {
    Error:
      "Project with name '" +
      project_name +
      "' has not a category '" +
      category_name +
      "'",
  };
}

async function deleteProjectFromCategory(category_name, project_name) {
  const category = await getCategory(category_name);
  if (category) {
    const category_projects = category.projects;
    if (hasKey(category_projects, project_name)) {
      const index = category_projects.indexOf(project_name);
      category_projects.splice(index, 1);
      category.projects = category_projects;
      const doc = await category.save();
      return doc;
    }
  }
  throw {
    Error:
      "Category with name '" +
      category_name +
      "' has no project " +
      project_name +
      "'",
  };
}

async function updateProject(name, new_project) {
  const project = await getProject(name);
  if (new_project.name && project.name !== new_project.name) {
    project.name = new_project.name;
  }
  if (
    new_project.description &&
    project.description !== new_project.description
  ) {
    project.description = new_project.description;
  }
  if (new_project.date && project.date !== new_project.date) {
    project.date = new_project.date;
  }
  const doc = await project.save();
  return doc;
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
  if (category) {
    return category;
  }
  throw {
    Error: "Cannot find category with name " + name,
  };
}

async function deleteCategory(name) {
  const category = await Category.findOne({ name: name });
  const doc = await category.remove();
  return doc;
}

async function updateCategory(name, new_category) {
  const category = await Category.findOne({ name: name });
  if (new_category.name && category.name !== new_category.name) {
    category.name = new_category.name;
  }
  if (
    new_category.description &&
    category.description !== new_category.description
  ) {
    category.description = new_category.description;
  }
  const doc = await category.save();
  return doc;
}

async function deleteProjectInCategory(category_name, project_name) {}

async function addProjectToCategory(category_name, project) {}

async function getCategoryProjects(category_name) {}

function returnSpaces(str) {
  return str.replace("_", " ");
}

function isEmptyObject(object) {
  return !Object.keys(object).length;
}

function hasKey(arr, key) {
  return arr.indexOf(key) !== -1;
}

/**
 * Server activation
 */

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
