const express = require("express");
const { check, validationResult } = require("express-validator");
const { writeQuestions, getQuestions } = require("../../utilites");
const uniqid = require("uniqid");
const questionsRouter = express.Router();

questionsRouter.get("/", async (req, res, next) => {
  try {
    const questionsDB = await getQuestions();
    if (questionsDB.length > 0) {
      res.status(200).send(questionsDB);
    } else {
      const err = new Error();
      err.message = "Questions not found";
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    next(error);
  }
});
questionsRouter.post(
  "/",
  [check("duration").isInt().exists().withMessage("Duration must be given"), check("text").exists().withMessage("Text must be given"), check("answers").exists().withMessage("Answers must be given")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const questionsDB = await getQuestions();
        await writeQuestions([...questionsDB, req.body]);
        res.status(201).send([...questionsDB, req.body]);
      }
    } catch (error) {
      next(error);
    }
  }
);

questionsRouter.put("/:questionIndex", async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error();
      err.message = errors;
      err.httpStatusCode = 400;
      next(err);
    } else {
      const questionsDB = await getQuestions();
      if (req.params.questionIndex < questionsDB.length) {
        const updatedQuestions = [...questionsDB.slice(0, req.params.questionIndex), { ...questionsDB[req.params.questionIndex], ...req.body }, ...questionsDB.slice(req.params.questionIndex + 1)];
        await writeQuestions(updatedQuestions);
        res.status(201).send(updatedQuestions);
      } else {
        const err = new Error();
        err.message = "Question not found";
        err.httpStatusCode = 404;
        next(err);
      }
    }
  } catch (error) {
    next(error);
  }
});
questionsRouter.delete("/:questionIndex", async (req, res, next) => {
  try {
    const questionsDB = await getQuestions();
    if (questionsDB.length > req.params.questionIndex) {
      questionsDB.splice(req.params.questionIndex, 1);
      await writeQuestions(questionsDB);
      res.status(201).send("Question deleted");
    } else {
      const err = new Error();
      err.message = "Question not found";
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = questionsRouter;
