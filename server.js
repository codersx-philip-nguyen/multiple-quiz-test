const mongoose = require("mongoose");
const express = require("express");
const app = express();

const Question = require("./models/Questions");
const Attempt = require("./models/Attempts");

// serve static files (html, css, js, images...)
app.use(express.static("public"));
// decode req.body from post body message
app.use(express.json({ extented: true }));
//connect to the database
const DATABASE_NAME = "a2_wpr";
mongoose
  .connect(`mongodb://localhost:27017/${DATABASE_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((result) => {
    const PORT = 8080;
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });

/****************************
 *         USAGE API
 ****************************/

// @route   POST /attempts
// @desc    start a new attempt
// @access  Public
app.post("/attempts", async (req, res) => {
  const { completed, score } = req.body;
  const questions = await Question.aggregate([{ $sample: { size: 10 } }]);
  try {
    //construct correctAnswers object
    let correctAnswers = {};
    questions.map((question) => {
      correctAnswers[question._id] = question.correctAnswers;
    });
    const newAttempt = new Attempt({
      questions,
      completed,
      score,
      correctAnswers,
    });
    const attempt = await newAttempt.save();

    //Hide correctAnswers
    const removed = ["correctAnswers"];
    let result = [];
    attempt.correctAnswers = {};
    attempt.questions.map((question) => {
      let newQuestionObject = Object.keys(question)
        .filter((key) => !removed.includes(key))
        .reduce((acc, key) => ((acc[key] = question[key]), acc), {});
      result.push(newQuestionObject);
    });
    attempt.questions = result;
    res.json(attempt);
  } catch (err) {
    console.log(err.message);
  }
});

// @route   POST /attempts/:id/submit
// @desc    submit & finish attemp
// @access  Public
app.post("/attempts/:id/submit", async (req, res) => {
  const attempt = await Attempt.findById(req.params.id);
  const { answers } = req.body;
  const { questions, correctAnswers } = attempt;
  try {
    //calculate the score
    let score = 0;
    let scoreText = "";

    for (let i = 0; i < questions.length; ++i) {
      let id = questions[i]._id;
      if (id in answers && correctAnswers[id] == answers[id]) {
        score += 1;
      }
    }
    if (score <= 6) {
      scoreText = "Practice more to improve it :D";
    } else if (score > 6 && score <= 8) {
      scoreText = "Well done!";
    } else {
      scoreText = "Excellent!";
    }

    //update score, completed, scoreText
    attempt.score = score;
    attempt.completed = true;
    attempt.scoreText = scoreText;

    const updatedAttempt = await attempt.save();

    res.json(updatedAttempt);
  } catch (err) {
    console.log(err.message);
  }
});

// @route   GET /attempts/:id
// @desc    get the attempt by id
// @access  Public
app.get("/attempts/:id", async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    res.json(attempt);
  } catch (err) {
    console.log(err.message);
  }
});

// @route   PATCH /attempts/:id
// @desc    save the user answers to the server
// @access  Public
app.patch("/attempts/:id", async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      alert("Attempt not found");
      return res.status(404).json({ msg: "Attempt not found" });
    }

    const { checkedAnswers } = await req.body;
    attempt.checkedAnswers = checkedAnswers;
    const updatedAttempt = await attempt.save();
    console.log(updatedAttempt);
    res.json(updatedAttempt);
  } catch (err) {
    console.log(err.message);
  }
});

/******************************
 *  ADDITIONAL TESTING API
 ******************************/

// @route   GET /api/questions
// @desc    get all the question
// @access  Admin
app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.log(err);
  }
});

// @route   POST /api/question
// @desc    create a question object
// @access  Admin
app.post("/api/question", async (req, res) => {
  const { text, answers, correctAnswers } = req.body;
  try {
    const newQuestion = new Question({
      text,
      answers,
      correctAnswers,
    });
    const question = await newQuestion.save();
    res.json(question);
  } catch (err) {
    console.log(err.message);
  }
});

// @route   DELETE /api/questions/:id
// @desc    delete a question by the id
// @access  Admin
app.delete("/api/questions/:id", async (req, res) => {
  const question = await Question.findById(req.params.id);
  try {
    await question.remove();
    res.json({ msg: "Question has been removed." });
  } catch (err) {
    console.log(err.message);
  }
});

// @route   DELETE /api/questions
// @desc    delete all the questions
// @access  Admin
app.delete("/api/questions", async (req, res) => {
  const questions = await Question.find();
  try {
    await questions.map((question) => {
      question.remove();
    });
    res.json("Remove all the questions!");
  } catch (err) {
    console.log(err.message);
  }
});

// @route   GET /attempts
// @desc    get all the attempts
// @access  Admin
app.get("/attempts", async (req, res) => {
  try {
    const attempts = await Attempt.find();
    res.json(attempts);
  } catch (err) {
    console.log(err.message);
  }
});

// @route   DELETE /attemtps
// @desc    delete all the attempts
// @access  Admin
app.delete("/attempts", async (req, res) => {
  const attempts = await Attempt.find();
  try {
    await attempts.map((attempt) => {
      attempt.remove();
    });
    res.json("Remove all the attempt!");
  } catch (err) {
    console.log(err.message);
  }
});
