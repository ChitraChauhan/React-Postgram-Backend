const postModal = require("../models/posts.modal");
const yup = require("yup");
const {
  filePath,
  title,
  description,
  isPrivate,
} = require("../utils/validations");
const { getImageBase64 } = require("../utils/getImageData");
const fs = require("fs");
// const { eventEmitter } = require("../utils/socketServer");

const CREATE_POST_VALIDATION_SCHEMA = yup.object({
  filePath,
  title,
  description,
  isPrivate,
});

const createPost = async (req, res, next) => {
  try {
    await CREATE_POST_VALIDATION_SCHEMA.validate(req.body);
    let imageBase64 = req.file
        ? fs.readFileSync(req.file.path, {encoding: "base64"})
        : null;
    const mimeType = req.file?.mimetype;
    imageBase64
        ? `data:${mimeType};base64,${imageBase64}`
        : null // ✅ THIS IS THE FIX

    const createdPost = await postModal.create({
        title: req.body.title,
        userId: req.user._id,
        filePath: imageBase64
    });
    const data = await postModal
      .findOne({ _id: createdPost._id })
      .populate({
        path: "userId",
        select: "_id firstname lastname username",
      })
      .lean();
    data.userData = data.userId;
    delete data.userId;
    data.filePath = imageBase64;
    // await eventEmitter("new-post", data, createdPost.isPrivate);
    return res.status(201).json({
      status: "success",
      data: data,
    });
  } catch (e) {
    next(e);
  }
};

const getFeedPost = async (req, res, next) => {
  try {
    let { page, perPage, search } = req.query;

    page = page && page > 0 ? Number(page) - 1 : 0;
    perPage = perPage && perPage > 0 ? Number(perPage) : 5;
    let searchQuery = { isPrivate: false };
    if (search) {
      searchQuery.title = {
        $regex: req.query.search,
        $options: "i",
      };
    }
    if (req.query.isMyPostsOnly && req.query.isMyPostsOnly === "true") {
      const userId = req.user._id;
      searchQuery.userId = userId;
    }
    if (req.query.isPrivate) {
      searchQuery.isPrivate = req.query.isPrivate == "true";
    }
    const totalPosts = await postModal.countDocuments(searchQuery);
    const pipeline = [
      {
        $match: searchQuery,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: page * perPage,
      },
      {
        $limit: perPage,
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: "$userData",
      },
      {
        $project: {
          _id: 1,
          filePath: 1,
          title: 1,
          description: 1,
          isPrivate: 1,
          createdAt: 1,
          userData: {
            _id: 1,
            firstname: 1,
            lastname: 1,
            username: 1,
            profilePhoto: 1
          },
        },
      },
    ];
    const getPosts = await postModal.aggregate(pipeline);
    return res.status(200).json({
      status: "success",
      data: {
        total: totalPosts,
        data: getPosts,
      },
    });
  } catch (e) {
    next(e);
  }
};

const getUsersPosts = async (req, res, next) => {
  try {
    let { page, perPage, userId, search } = req.query;

    page = page && page > 0 ? Number(page) - 1 : 0;
    perPage = perPage && perPage > 0 ? perPage : 5;

    let searchQuery = { isPrivate: false };
    if (search) {
      searchQuery.title = {
        $regex: req.query.search,
        $options: "i",
      };
    }
    if ((userId && userId === req.user._id) || !userId) {
      delete searchQuery.isPrivate;
      searchQuery = { userId: req.user._id, ...searchQuery };
    } else {
      searchQuery.userId = userId;
    }
    const totalPosts = await postModal.countDocuments(searchQuery);
    const getPosts = await postModal
      .find(searchQuery)
      .skip(page * perPage)
      .limit(perPage)
      .sort({ createdAt: "desc" });
    return res.status(200).json({
      status: "success",
      data: {
        total: totalPosts,
        data: getPosts,
      },
    });
  } catch (error) {
    next(e);
  }
};

const getImage = async (req, res, next) => {
  try {
    const { postId } = req.query;
    if (!postId) {
      return res
        .status(400)
        .json({ status: "error", message: "Post Id not provided." });
    }

    const post = await postModal.findById({ _id: postId });
    if (!post) {
      return res
        .status(404)
        .json({ status: "error", message: "Post not found." });
    }

    if (!post.filePath) {
      return res
        .status(404)
        .json({ status: "error", message: "Post contain no image." });
    }

    if (post.isPrivate && !post.userId === req.user._id) {
      return res
        .status(403)
        .json({ status: "error", message: "Private post." });
    }

    const base64 = await getImageBase64(post.filePath);
    return res.status(200).json({ status: "success", imageData: base64 });
  } catch (e) {
    next(e);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const isDeleted = await postModal.findOneAndDelete({_id: req.params.id});
    if (!isDeleted) {
      return res
          .status(404)
          .json({ status: "error", message: "Post not found" });
    }
    return res
        .status(200)
        .json({ status: "success", message: "Post deleted successfully." });
  } catch (e) {
    next(e);
  }
};

// update post
const updatePost = async (req, res, next) => {
  try {
    console.log('req.body', req.body)
    const post = await postModal.findByIdAndUpdate(req.body._id, req.body);
    console.log('post', post);
    if (!post) {
      return res.status(403).json("Post not found");
    }
    return res.status(200).json({ status: "success", data: post });
  } catch (err) {
    res.status(500).json(err);
  }
};


module.exports = {
  createPost,
  getFeedPost,
  getUsersPosts,
  getImage,
  deletePost,
  updatePost
};
