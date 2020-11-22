const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    questions: {
      type: Array,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
      required: true,
    },
    correctAnswers: {
      type: Object,
      required: true,
    },
    answers: {
      type: Object,
    },
    checkedAnswers: {
      type: Object,
    },
    scoreText: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Attempt = mongoose.model("attempt", attemptSchema);
