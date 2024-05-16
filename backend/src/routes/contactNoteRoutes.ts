import express from "express";
import isAuth from "../middleware/isAuth";

import * as ContactNoteController from "../controllers/ContactNoteController";

const contactNoteRoutes = express.Router();

contactNoteRoutes.get(
  "/contact-notes/list",
  isAuth,
  ContactNoteController.findFilteredList
);

contactNoteRoutes.post("/contact-notes", isAuth, ContactNoteController.store);

contactNoteRoutes.delete(
  "/contact-notes/:id",
  isAuth,
  ContactNoteController.remove
);

export default contactNoteRoutes;
