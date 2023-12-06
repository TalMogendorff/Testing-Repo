const express = require("express");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User, validate, validateProjects } = require("../models/user");
const { Project } = require("../models/emrProject");
const auth = require("../middleware/auth");
const router = express.Router();

const getProjects = async (projcetsArray) => {
  const projects = await Project.find({ projectNumber: { $in: projcetsArray } });
  return projects;
};

router.get('/my-favorites',auth,async (req,res)=>{

try{
  const user = await User.findById(req.user._id).populate('favorites');
  res.send(user.favorites);

}
catch(error){
  res.status(404).send('Invalid User')
}

})

router.put('/favorites/:id', auth, async(req,res)=>{
    if (!req.params.id) return res.status(400).send("No Id provided !");
    try {
      let user = await User.findById(req.user._id);
      if (!user) return res.status(400).send("No User Found !");
       user.favorites.pull(req.params.id);
       await user.save();
      res.status(200).send("Favorite have been deleted");

    } catch (error) {
      res.status(500).send("Unexpected error has occured");
    }
})

router.post('/favorites/:id',auth,async (req,res)=>{
  if(!req.params.id) return res.status(400).send('No Id provided !');
try{
  let user = await User.findById(req.user._id);
  if(!user) return res.status(400).send("No User Found !");
  const savedFavorites = user.favorites.addToSet(req.params.id);
  if (!savedFavorites.length)return res.status(409).send("This Project already in Favorite list");
  await user.save();
  res.status(200).send('Favorite have been add')
}
catch(error){
  res.status(500).send('Unexpected error has occured');
}
})

router.get("/projects", auth, async (req, res) => {
  if (!req.query.numbers) res.status(400).send("Missing numbers data");

  let data = {};
  data.projects = req.query.numbers.split(",");

  const projects = await getProjects(data.projects);
  res.send(projects);
});

router.patch("/projects", auth, async (req, res) => {
  const { error } = validateProjects(req.body);
  if (error) res.status(400).send(error.details[0].message);

  const projects = await getProjects(req.body.projects);
  if (projects.length != req.body.projects.length)
    res.status(400).send("Project numbers don't match");

  let user = await User.findById(req.user._id);
  user.projects = req.body.projects;
  user = await user.save();
  res.send(user);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(
    _.pick(req.body, ["name", "email", "password", "projects"])
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  res.send(_.pick(user, ["_id", "name", "email"]));
});

module.exports = router;
