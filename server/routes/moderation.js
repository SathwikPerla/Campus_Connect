const { body, param, validationResult } = require("express-validator");
const express = require("express");
const Post = require("../models/Post");
const { authMiddleware } = require("../middleware/Auth");
const router = express.Router();

/* ---------------------------------------------------------
   TEMP adminAuth (since real admin system not implemented)
   Prevents Express from crashing with "callback undefined"
--------------------------------------------------------- */
const safeAdmin = (req, res, next) => next();

/**
 * @route GET /api/moderation/queue
 * @desc Get posts pending moderation review
 * @access Private/Admin
 */
router.get("/queue", [authMiddleware, safeAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      $or: [
        { moderationStatus: "under_review" },
        { "appeal.status": "pending" },
      ],
    };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("userId", "username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(query),
    ]);

    res.json({
      success: true,
      posts,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    console.error("Get moderation queue error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching moderation queue",
    });
  }
});

/**
 * @route POST /api/moderation/decide/:postId
 * @desc Moderate a post (approve/reject)
 * @access Private/Admin
 */
router.post(
  "/decide/:postId",
  [
    authMiddleware,
    safeAdmin,
    param("postId").isMongoId(),
    body("action").isIn(["approve", "reject"]),
    body("reason").optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { postId } = req.params;
      const { action, reason } = req.body;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const update = {
        moderationStatus: action === "approve" ? "approved" : "rejected",
        isApproved: action === "approve",
        $push: {
          moderationHistory: {
            status: action === "approve" ? "approved" : "rejected",
            reason:
              reason ||
              (action === "approve"
                ? "Manually approved by moderator"
                : "Content violates community guidelines"),
            moderatedBy: req.user?._id || null,
            moderationId: `mod-${require("uuid").v4()}`,
            confidence: post.autoModeration?.confidence || 0,
            reasons: post.autoModeration?.reasons || [],
          },
        },
      };

      if (post.appeal?.status === "pending") {
        update["appeal.status"] =
          action === "approve" ? "approved" : "rejected";
        update["appeal.reviewedBy"] = req.user?._id || null;
        update["appeal.reviewedAt"] = new Date();
        update["appeal.reviewNotes"] = reason || "Reviewed by moderator";
      }

      const updatedPost = await Post.findByIdAndUpdate(postId, update, {
        new: true,
        runValidators: true,
      }).populate("userId", "username avatar");

      res.json({
        success: true,
        message: `Post ${
          action === "approve" ? "approved" : "rejected"
        } successfully`,
        post: updatedPost,
      });
    } catch (error) {
      console.error("Moderation decision error:", error);
      res.status(500).json({
        success: false,
        message: "Error processing moderation decision",
      });
    }
  }
);

/**
 * @route POST /api/moderation/appeal/:postId
 * @desc Appeal a moderation decision
 * @access Private
 */
router.post(
  "/appeal/:postId",
  [
    authMiddleware,
    param("postId").isMongoId(),
    body("reason").isString().trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { postId } = req.params;
      const { reason } = req.body;

      const post = await Post.findOne({
        _id: postId,
        userId: req.user._id,
        moderationStatus: "rejected",
        "appeal.status": { $ne: "pending" },
      });

      if (!post) {
        return res.status(400).json({
          success: false,
          message:
            "Post not found, not rejected, or already has a pending appeal",
        });
      }

      post.appeal = {
        status: "pending",
        reason,
        submittedAt: new Date(),
      };

      post.moderationStatus = "under_review";
      post.moderationHistory.push({
        status: "under_review",
        reason: "User appealed moderation decision",
        moderatedAt: new Date(),
        moderationId: `appeal-${require("uuid").v4()}`,
        reasons: [`Appeal reason: ${reason}`],
      });

      await post.save();

      res.json({
        success: true,
        message:
          "Appeal submitted successfully. Our moderators will review your request.",
        post,
      });
    } catch (error) {
      console.error("Appeal submission error:", error);
      res.status(500).json({
        success: false,
        message: "Error submitting appeal",
      });
    }
  }
);

/**
 * @route GET /api/moderation/stats
 * @desc Get moderation statistics
 * @access Private/Admin
 */
router.get("/stats", [authMiddleware, safeAdmin], async (req, res) => {
  try {
    const [
      totalPosts,
      approvedPosts,
      rejectedPosts,
      pendingReview,
      pendingAppeals,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ moderationStatus: "approved" }),
      Post.countDocuments({ moderationStatus: "rejected" }),
      Post.countDocuments({ moderationStatus: "under_review" }),
      Post.countDocuments({ "appeal.status": "pending" }),
    ]);

    res.json({
      success: true,
      stats: {
        totalPosts,
        approved: {
          count: approvedPosts,
          percentage: totalPosts
            ? Math.round((approvedPosts / totalPosts) * 100)
            : 0,
        },
        rejected: {
          count: rejectedPosts,
          percentage: totalPosts
            ? Math.round((rejectedPosts / totalPosts) * 100)
            : 0,
        },
        pendingReview,
        pendingAppeals,
      },
    });
  } catch (error) {
    console.error("Get moderation stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching moderation statistics",
    });
  }
});

module.exports = router;
