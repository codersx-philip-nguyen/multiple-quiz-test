const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  answers: {
    type: Array,
    required: true,
  },
  correctAnswers: {
    type: String,
    required: true,
  },
});

module.exports = Question = mongoose.model("question", questionSchema);
