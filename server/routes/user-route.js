const bcrypt = require("bcryptjs");
const express = require("express");

const check = require("../middlewares/auth-middleware").auth;
const User = require("../models/user");
const Post = require("../models/post");
const FriendRequest = require("../models/friend-request");
const userValidatorUpdate = require("../validators/user-validator")
  .generateValidatorUpdate;

const router = express.Router();

router.get("/users", check, (req, res) => {
  try {
    User.find()
      .lean()
      .populate("friends")
      .then((users) => {
        if (users.length === 0)
          res.status(404).json({
            message: "No users found",
          });
        res.json(users);
      });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/users/:userid", check, (req, res) => {
  try {
    const { userid } = req.params;
    User.findById(userid)
      .populate('friends')
      .then((user) => {
        if (!user) {
          res.status(404).json({
            message: "user not found",
          });
        }
        res.json(user);
      });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.put("/users/:userid", check, userValidatorUpdate, async (req, res) => {
  const { userid } = req.params;
  const { password } = req.body;
  try {
    let hashedPassword = "";

    if (password) {
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(req.body.password, salt);
    }

    const updatedData = { ...req.body };

    if (password) {
      delete updatedData.password;
      updatedData.password = hashedPassword;
    }

    const updateResult = await User.updateOne({ _id: userid }, updatedData);

    if (updateResult.nModified === 1) {
      return res.json({ ...updatedData, _id: userid });
    } else {
      res.status(500).json({
        message: "An internal error occurred.",
        details: ["Update result did not return 1."],
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/users/:userid/posts", check, async (req, res) => {
  const { userid } = req.params;
  try {
    Post.find({ author: userid })
      .sort({ timestamp: -1 })
      .populate("author")
      .then((posts) => {
        if (posts.length === 0) {
          return res.status(404).json({
            message: "No posts found.",
          });
        }
        return res.json(posts);
      });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// To show all requests //
router.get("/users/:userid/friendrequests", check, async (req, res) => {
  const { userid } = req.params;
  try {
    FriendRequest.find({ receiver: userid })
      .lean()
      .populate("sender")
      .populate("receiver")
      .then((results) => {
        if (results.length === 0) {
          return res.status(404).json({
            message: "No requests found",
          });
        }
        return res.json(results);
      });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// To accept the friend request //
router.put("/users/:userid/friend", check, async (req, res) => {
  const { _id } = req.body;
  const { userid } = req.params;
  try {
    if (!_id) {
      return res.status(400).json({
        message: "Bad request.",
        details: ["User id was not sent on request body"],
      });
    }

    const userToAdd = await User.findById(_id);

    if (!userToAdd) {
      return res.status(400).json({
        message: "Bad request.",
        details: ["ID sent on request body returns no user"],
      });
    }

    const userRequested = await User.findById(userid);

    if (userRequested.friends.indexOf(_id) !== -1) {
      return res.status(400).json({
        message: "Bad request.",
        details: ["User already has the requester ID on friend array."],
      });
    }

    userRequested.friends.push(_id);
    // userToAdd.friends.push(userid);

    const saveResult = userRequested.save();
    // userToAdd.save();
    return res.json(saveResult);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.put("/users/:userid/unfriend", check, async (req, res) => {
  const { _id } = req.body;
  const { userid } = req.params;
  try {
    if (!_id) {
      return res.status(400).json({
        message: "Bad request.",
        details: ["User id was not sent on request body"],
      });
    }

    const user = await User.findById(userid);

    if (!user) {
      return res.status(400).json({
        message: "Bad request.",
        details: ["User does not exist."],
      });
    }

    user.friends = [...user.friends].filter(
      (friend) => friend.toString() !== _id
    );

    const updateResult = await User.updateOne(
      { _id: userid },
      { friends: user.friends }
    );

    return res.json(updateResult);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/users/search/:pattern", check, (req, res) => {
  const { pattern } = req.params;
  try {
    // let query = pattern.split(" ");
    let query = pattern.split("+");

    if (query.length === 1) {
      query = [pattern, pattern];
    }

    User.find({
      $or: [
        { firstName: { $regex: query[0], $options: "i" } },
        { lastName: { $regex: query[1], $options: "i" } },
      ],
    }).then((matches) => {
      if (matches.length === 0) {
        return res.status(404).json({
          message: "No matches found",
        });
      }

      return res.json(matches);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
