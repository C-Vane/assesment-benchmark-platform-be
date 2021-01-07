const express = require("express");
const { check, validationResult } = require("express-validator");
const { getExams, writeExams, getQuestions } = require("../../utilites");
const uniqid = require("uniqid");
const examsRouter = express.Router();

examsRouter.post("/start/", [check("candidateName").exists().withMessage("Candidate name must be given")], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error();
      err.message = errors;
      err.httpStatusCode = 400;
      next(err);
    } else {
      const questionsDB = await getQuestions();
      const examsDB = await getExams();
      let time = req.query.time;
      let currentQuestions = [];
      let allQuestions = questionsDB;
      let num = 0;
      if (time) {
        for (let sum = 0; sum < time * 60; sum++) {
          num = Math.floor(Math.random() * allQuestions.length + 1);
          allQuestions[num];
          currentQuestions.push(allQuestions[num]);
          allQuestions.splice(num, 1);
          sum = sum - 1 + allQuestions[num].duration;
        }
      } else {
        for (let i = 0; i < 5; i++) {
          num = Math.floor(Math.random() * allQuestions.length + 1);
          currentQuestions.push(allQuestions[num]);
          allQuestions.splice(num, 1);
        }
      }
      const exam = {
        ...req.body,
        totalDuration: parseInt(time),
        _id: uniqid(),
        examDate: new Date(),
        isCompleted: false,
        result: 0,
        questions: currentQuestions,
      };
      await writeExams([...examsDB, exam]);
      currentQuestions.forEach((question) => {
        question.answers.forEach((answer) => delete answer.isCorrect);
      });
      res.status(201).send({
        _id: exam._id,
        questions: currentQuestions,
      });
    }
  } catch (error) {
    next(error);
  }
});
examsRouter.post("/:id/answers", [check("question").isInt().exists().withMessage("Please provide question Index")], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error();
      err.message = errors;
      err.httpStatusCode = 400;
      next(err);
    } else {
      const examsDB = await getExams();
      const currentIndex = examsDB.findIndex((exam) => req.params.id === exam._id);
      if (currentIndex !== -1 && req.body.question < examsDB[currentIndex].questions.length && examsDB[currentIndex].questions[req.body.question].providedAnswer === undefined) {
        const currentquestion = { ...examsDB[currentIndex].questions[req.body.question], providedAnswer: req.body.answer || false };
        const questions = [...examsDB[currentIndex].questions.slice(0, req.body.question), currentquestion, ...examsDB[currentIndex].questions.slice(req.body.question + 1)];
        const value = (examsDB[currentIndex].questions[req.body.question].duration / examsDB[currentIndex].totalDuration / 3) * 5;
        const exam = {
          ...examsDB[currentIndex],
          questions,
          result: Array.isArray(req.body.answer)
            ? req.body.answer.every((answer) => currentquestion.answers[answer].isCorrect) && currentquestion.answers.filter((answer) => answer.isCorrect).length === req.body.answer.length
              ? examsDB[currentIndex].result + value
              : examsDB[currentIndex].result
            : currentquestion.answers[req.body.answer].isCorrect && currentquestion.answers.filter((answer) => answer.isCorrect).length === 1
            ? examsDB[currentIndex].result + value
            : examsDB[currentIndex].result,
          isCompleted: questions.every((question) => question.providedAnswer !== undefined) ? true : false,
        };
        await writeExams([...examsDB.slice(0, currentIndex), exam, ...examsDB.slice(currentIndex + 1)]);
        res.status(201).send(
          exam.isCompleted
            ? {
                _id: exam._id,
                candidateName: exam.candidateName,
                result: exam.result,
              }
            : "Answer Submitted"
        );
      } else {
        const err = new Error();
        err.message = "Incorrect Format or answer for question already provided";
        err.httpStatusCode = 400;
        next(err);
      }
    }
  } catch (error) {
    next(error);
  }
});
examsRouter.get("/:id/", async (req, res, next) => {
  try {
    const examsDB = await getExams();
    const currentExam = examsDB.find((exam) => req.params.id === exam._id);
    if (currentExam) {
      let questions = [];
      currentExam.questions.forEach((question) => {
        questions.push({ ...question, answers: [question.answers[question.providedAnswer]] });
      });
      res.status(200).send({ ...currentExam, questions });
    } else {
      const err = new Error();
      err.message = "Exam not found";
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = examsRouter;
