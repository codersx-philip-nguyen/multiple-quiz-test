const $header = document.querySelector("header");
const $introSection = document.querySelector("#introduction");

//Screen 2
const $quizSection = document.querySelector("#attempt-quiz");
const $quizContainer = document.querySelector("#quiz");
const $optionElements = document.querySelector(".all_options");
const $submit_block = document.querySelector(".submit-block");

//screen 3
const $resultSection = document.querySelector("#review-quiz");
const $scorePerTen = document.querySelector(".inTen");
const $scorePercentage = document.querySelector(".inPercentage");
const $msg = document.querySelector(".message");

let idAttempt;
const getAttemptById = async () => {
  let current_attemptID = localStorage.getItem("attempt_id");
  const response = await fetch(`/attempts/${current_attemptID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

const startAttempt = async () => {
  const reponse = await fetch("/attempts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const attemptObject = await reponse.json();
  return attemptObject;
};

const quizGenerator = async (e) => {
  // class hiden
  $introSection.classList.add("hidden");
  $quizSection.classList.remove("hidden");

  let data;
  if (localStorage.getItem("attempt_id")) {
    data = await getAttemptById();
  } else {
    data = await startAttempt();
    localStorage.setItem("attempt_id", data._id);
  }

  data.questions.map((ques, index) => {
    // create a div for wrap each question
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("ques-section");
    questionDiv.id = `${ques._id}`;

    // create new element <h1 class="ques-counter"> Question ? of 10
    const quesCounter = document.createElement("h1");
    quesCounter.classList.add("ques-counter");
    quesCounter.textContent = `Question ${index + 1} of 10`;

    // create new element <p> Question ?
    const p = document.createElement("p");
    p.textContent = `Question ${index + 1}: ${ques.text}`;
    p.classList.add("ques-title");
    p.id = `${ques._id}`;

    questionDiv.appendChild(quesCounter);
    questionDiv.appendChild(p);

    //loop through answers[]
    ques.answers.map((option, i) => {
      //create new ele <div class="options">
      const div = document.createElement("div");
      div.classList.add("options");

      // create new el <input tpye-radio id name class="option-radio">
      const input = document.createElement("input");
      input.id = `question${index + 1}_option${i}`;
      input.setAttribute("type", "radio");
      input.value = `${i}`;
      input.classList.add("option-radio");
      input.name = `${p.id}`;

      //<label class="option">
      const label = document.createElement("label");
      label.setAttribute("for", `question${index + 1}_option${i}`);
      label.textContent = option;
      label.classList.add("label-ques");
      const br = document.createElement("br");

      // wrap input, label br eles to div
      div.appendChild(input);
      div.appendChild(label);
      div.appendChild(br);

      questionDiv.appendChild(div);

      // wrap all the things above to $optionElements
      $optionElements.appendChild(questionDiv);
    });
  });

  await getCheckedAnswers();

  $startBtn.removeEventListener("click", quizGenerator);
  idAttempt = data._id;
};

const getCheckedAnswers = async () => {
  //build an object that holds user's answers
  let body = {
    checkedAnswers: {},
  };

  const $inputs = document.querySelectorAll("input");
  for (input of $inputs) {
    const _input = document.querySelector(`#${input.id}`);
    _input.addEventListener("click", () => {
      if (_input.checked) {
        body.checkedAnswers[_input.name] = parseInt(_input.value);
      }
      console.log(body);
    });
  }

  //call patch api
  const attempt_id = localStorage.getItem("attempt_id");
  const res = await fetch(`/attempts/${attempt_id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
};

const onSubmitQuiz = async () => {
  //if user finish your work, clear the localStorage
  localStorage.removeItem("attempt_id");
  // alert
  if (!window.confirm("Do you want to submit?")) {
    return;
  }

  //hidden btn submit
  $submitBtn.classList.add("hidden");
  $resultSection.classList.remove("hidden");
  $redoBtn.classList.remove("hidden");
  $submit_block.classList.add("hidden");

  const $inputs = document.querySelectorAll("input");

  //object to send as the body
  const body = {
    answers: {},
  };

  const checkedInputs = [];

  for (input of $inputs) {
    if (input.checked) {
      //push pair of quesId and seleteted index to object
      checkedInputs.push(input);
      body.answers[input.name] = parseInt(input.value);
    }
  }

  const apiSubmit = `/attempts/${idAttempt}/submit`;
  const response = await fetch(apiSubmit, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const solutions = data.correctAnswers;

  //gray all correct answer and disable input
  for (input of $inputs) {
    let quesID = input.name;
    let trueAnswer = input.value;
    let $selectedLabels = document.querySelector(`label[for=${input.id}]`);

    if (trueAnswer == solutions[quesID]) {
      // color all correct answers
      $selectedLabels.style = "background-color: gray;";
      const div = document.createElement("div");
      div.classList.add("message-res");
      div.textContent = "Correct answer";
      $selectedLabels.insertAdjacentElement("afterend", div);
    }
    input.disabled = true;
  }

  // Display mark
  const finalInTen = `${data.score}/10`;
  const finalInPercentage = `${(data.score / 10) * 100}%`;
  $scorePerTen.textContent = finalInTen;
  $scorePercentage.textContent = finalInPercentage;

  $msg.textContent = data.scoreText;

  // loop through all the checked input and css them
  for (input of checkedInputs) {
    let selectedIndex = input.value;
    let quesId = input.name;
    let $selectedLabels = document.querySelector(`label[for=${input.id}]`);

    if (selectedIndex == data.correctAnswers[quesId]) {
      $selectedLabels.style = "background-color: #d4edda;";
    } else {
      $selectedLabels.style = "background-color: #f8d7da;";
      const div = document.createElement("div");
      div.classList.add("message-res");
      div.textContent = "Your answer";
      $selectedLabels.insertAdjacentElement("afterend", div);
    }
  }
};

const onTryAgain = () => {
  //back to screen 1 and scroll up to the top
  $header.scrollIntoView();

  // reset section content
  $optionElements.innerHTML = "";
  $scorePercentage.innerHTML = "";
  $scorePerTen.innerHTML = "";
  $msg.innerHTML = "";

  // remove, add hidden class
  $submitBtn.classList.remove("hidden");
  $introSection.classList.remove("hidden");
  $quizSection.classList.add("hidden");
  $resultSection.classList.add("hidden");
  $submit_block.classList.remove("hidden");

  //create new event
  const $startBtn1 = document.querySelector("#btn-start");
  $startBtn1.addEventListener("click", quizGenerator);
  const $submitBtn1 = document.querySelector("#btn-submit");
  $submitBtn1.addEventListener("click", onSubmitQuiz);
};

// catch events
const $startBtn = document.querySelector("#btn-start");
const $redoBtn = document.querySelector("#btn-try-attempt");
const $submitBtn = document.querySelector("#btn-submit");
$startBtn.addEventListener("click", quizGenerator);
$submitBtn.addEventListener("click", onSubmitQuiz);
$redoBtn.addEventListener("click", onTryAgain);
