const express = require("express");
const { check, validationResult } = require("express-validator");
const { getCandidates, writeCandidates } = require("../../utilites");
const uniqid = require("uniqid");

const candidatesRouter = express.Router();
candidatesRouter.get("/", async (req, res, next) => {
  try {
    const all = await getCandidates();
    let candidates;
    if (req.query && req.query.result) {
      candidates = all.find((candidate) => candidate.result === req.query.result);
    }
    res.send(candidates);
  } catch (error) {
    next(error);
  }
});

candidatesRouter.get("/:id", async (req, res, next) => {
  try {
    const all = await getCandidates();
    const candidate = all.find((candidate) => candidate._id === req.params.id);
    res.send(candidate);
  } catch (error) {
    next(error);
  }
});
candidatesRouter.post(
  "/",
  [
    check("name").isLength({ min: 4 }).withMessage("No way! Name too short!").exists().withMessage("Add a name please!"),
    check("surname").isLength({ min: 4 }).withMessage("No way! Surname too short!").exists().withMessage("Add a surname please!"),
    check("email").isEmail().withMessage("No way! Email not correct!").exists().withMessage("Add an email please!"),
    check("yearOfBirth").isNumeric().withMessage("Year of pirth should be a number").exists().withMessage("Add a Year of birth please!"),
    check("street").isLength({ min: 5 }).withMessage("Invalid street").exists().withMessage("Add street please!"),
    check("city").exists().withMessage("Add City please!"),
    check("country").exists().withMessage("Add country Please!"),
    check("postalCode").exists().withMessage("Add Postal Code please!"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const candidates = await getCandidates();
        const email = candidates.find((candidate) => candidate.email === req.body.email);
        if (email) {
          const err = new Error();
          err.message = "Email already used";
          err.httpStatusCode = 409;
          next(err);
        } else {
          const newcandidate = {
            ...req.body,
            _id: uniqid(),
            role: "candidate",
            examRetakes: 0,
          };
          candidates.push(newcandidate);
          await writeCandidates(candidates);
          res.status(201).send(newcandidate);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

candidatesRouter.put(
  "/:id",
  [
    check("name").isLength({ min: 4 }).withMessage("No way! Name too short!").exists().withMessage("Add a name please!"),
    check("surname").isLength({ min: 4 }).withMessage("No way! Surname too short!").exists().withMessage("Add a surname please!"),
    check("email").isEmail().withMessage("No way! Email not correct!").exists().withMessage("Add an email please!"),
    check("yearOfBirth").isNumeric().withMessage("Year of pirth should be a number").exists().withMessage("Add a Year of birth please!"),
    check("street").isLength({ min: 5 }).withMessage("Invalid street").exists().withMessage("Add street please!"),
    check("city").exists().withMessage("Add City please!"),
    check("country").exists().withMessage("Add country Please!"),
    check("postalCode").exists().withMessage("Add Postal Code please!"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const candidates = await getCandidates();
        const email = candidates.find((candidate) => candidate.email === req.body.email && candidate._id !== req.params.id);
        if (email) {
          const err = new Error();
          err.message = "Email already used";
          err.httpStatusCode = 409;
          next(err);
        } else {
          const candidateIndex = candidates.findIndex((candidate) => candidate._id === req.params.id);
          if (candidateIndex !== -1) {
            delete req.body._id;
            const updatecandidate = {
              ...candidates[candidateIndex],
              ...req.body,
            };
            const updatedDB = [...candidates.slice(0, candidateIndex), updatecandidate, ...candidates.slice(candidateIndex + 1)];
            await writeCandidates(updatedDB);
            res.status(201).send(updatecandidate);
          } else {
            const err = new Error();
            err.httpStatusCode = 404;
            err.message = "candidate Not Found";
            next(err);
          }
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

candidatesRouter.delete("/:id", async (req, res, next) => {
  try {
    const candidates = await getCandidates();
    const filterdcandidates = candidates.filter((candidate) => candidate._id !== req.params.id);
    if (filterdcandidates.length === candidates.length) {
      const error = new Error("candidate not found");
      error.httpStatusCode = 404;
      return next(error);
    }
    await writeCandidates(filterdcandidates);
    res.status(201).send("Account has been deleted");
  } catch (error) {
    next(error);
  }
});
///Get bookings list
candidatesRouter.get("/:id/myBookings", async (req, res, next) => {
  try {
    const bookings = await getBookings();
    const mylist = bookings.find((bookings) => bookings.clientId === req.params.id) || [];
    res.send(mylist);
  } catch (error) {
    next(error);
  }
});
candidatesRouter.post(
  "/:id/booking/",
  [
    check("start").isDate().exists().withMessage("Please add start date "),
    check("end").isDate().exists().withMessage("Please add end date "),
    check("placeId").exists().withMessage("Please add the place Id "),
  ],
  async (req, res, next) => {
    try {
      const candidates = await getCandidates();

      const candidateIndex = candidates.findIndex((candidate) => candidate._id === req.params.id);

      if (candidateIndex !== -1) {
        const places = await getPlaces();
        const place = places.find((place) => place._id === req.body.placeId);

        if (place) {
          const bookings = await getBookings();
          const currentBookings = bookings.filter((booking) => booking.placeId === req.body.placeId);
          let available =
            moment(req.body.start).isBetween(place.start, place.end, "day", []) && moment(req.body.end).isBetween(place.start, place.end, "day", [])
              ? currentBookings.length > 0
                ? bookings.every((booking) => !moment(req.body.start).isBetween(booking.start, booking.end, "day", []) && !moment(req.body.end).isBetween(booking.start, booking.end, "day", []))
                  ? true
                  : false
                : true
              : true;
          if (available) {
            //book
            const newBooking = {
              ...req.body,
              _id: uniqid(),
              candidateName: +-+5 < [candidateIndex].name + " " + candidates[candidateIndex].surname,
              candidateEmail: candidate[candidateIndex].email,
              candidateId: req.params.id,
            };
            //send email-
            await writeBookings(bookings.push(newBooking));
            res.status(201).send(newBooking);
          } else {
            const err = new Error();
            err.message = "Place not available in this period";
            err.httpStatusCode = 409;
            next(err);
          }
        } else {
          const err = new Error();
          err.message = "Place  not found";
          err.httpStatusCode = 404;
          next(err);
        }
      } else {
        const err = new Error();
        err.message = "Client not found";
        err.httpStatusCode = 404;
        next(err);
      }
    } catch (error) {
      next(error);
    }
  }
);
candidatesRouter.delete("/:id/booking/:bookingId", async (req, res, next) => {
  try {
    const bookings = await getBookings();
    const booking = bookings.filter((booking) => !(booking._id === req.params.bookingId && booking.candidateId === req.params.id));
    if (booking.length !== bookings) {
      res.status(201).send("Booking calceled");
    } else {
      const err = new Error();
      err.message = "Booking or client not found";
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    next(error);
  }
});

/// POST Profile picture

candidatesRouter.post("/:id/upload", async (req, res, next) => {
  try {
    const candidates = await getCandidates();
    const candidateIndex = candidates.findIndex((candidate) => candidate._id === req.params.id);

    if (candidateIndex !== -1) {
      // candidate found
      const updatedcandidates = [...candidates.slice(0, candidateIndex), { ...candidates[candidateIndex], image: req.file.path }, ...candidates.slice(candidateIndex + 1)];
      await writeCandidates(updatedcandidates);
      res.send(updatedcandidates[candidateIndex]);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      err.message = "candidate Not Found";
      next(err);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = candidatesRouter;
