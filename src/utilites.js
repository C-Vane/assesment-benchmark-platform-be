const { readJSON, writeJSON } = require("fs-extra");
const { join } = require("path");

const examsPath = join(__dirname, "./services/exams/exams.json");
const questionsPath = join(__dirname, "./services/questions/questions.json");
const candidatesPath = join(__dirname, "./services/candidates/candidates.json");

const readDB = async (filePath) => {
  try {
    const fileJson = await readJSON(filePath);
    return fileJson;
  } catch (error) {
    throw new Error(error);
  }
};

const writeDB = async (filePath, fileContent) => {
  try {
    await writeJSON(filePath, fileContent);
  } catch (error) {
    throw new Error(error);
  }
};
module.exports = {
  getExams: async () => readDB(examsPath),
  writeExams: async (examsData) => writeDB(examsPath, examsData),
  getQuestions: async () => readDB(questionsPath),
  writeQuestions: async (questionsData) => writeDB(questionsPath, questionsData),
  getCandidates: async () => readDB(candidatesPath),
  writeCandidates: async (candidatesData) => writeDB(candidatesPath, candidatesData),
};
