import express from "express";
import isAuth from "../middleware/isAuth";

import * as MediaController from '../controllers/MediaController';

const routes = express.Router();

routes.get("/mediaFinder", isAuth, MediaController.find);
routes.get("/mediaRemove", isAuth, MediaController.remove);

export default routes;
