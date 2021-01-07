### Assesment and Benchmark Platform

Assessment &amp; Benchmarking platform , used to assess the skill level of a candidate through a series of multi choice questions and answers.
The application should guide the candidate through a set of questions, collect all the provided answers and show him the result of his own assessment

Company requirements:

- Use Node + Express as backend technology
- Store all the information in files (No DB allowed)
- The codebase should be in JavaScript
- Every part should be available in GitHub

###

<h5>Backend Features:</h5>
<h6>POST</h6>
<ul>
  <strong>/exams:</strong>
  <li> 
    <ul> <strong>/start:</storng>
      <li> Generate a new Exam with 5 randomly picked questions in it. A candidateID must be provided in the body to be able to do so.</li>
      <li>
        <ul>/?time:
          <li> EXTRA The sum of the duration of the randomly picked questions for that exam does not exceed the specified duration/time (query)</li>
        </ul>
      </li>
    </ul>
  </li>
  <li>
  <ul>
    <strong>/exam/{id}/answer</strong>:
    <li>Answer to a question for the given exam {id}, It is not possible to answer to a question twice,<strong> EXTRA</strong> it is possible to have multiple correct answers in a question</li>
    <li>The waight of a question on a final result is propotiona lto the ammount of time given for each question. </li>
    </li>
  </ul>

<h6>GET</h6>

<ul>
  <strong>/exams/{id}</strong>:
  <li> Returns the exam at it's current state </li>
</ul>

EXTRA
<ul>
  <li> CRUD /questions:
    - The admin can add, edit, remove questions.
  </li>
   <li> CRUD /candidate: 
    - The user can add, edit, remove candidates.
  </li>
<ul>
