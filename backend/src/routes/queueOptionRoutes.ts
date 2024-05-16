import { Router } from "express";
import isAuth from "../middleware/isAuth"
import multer from "multer";

import * as QueueOptionController from "../controllers/QueueOptionController";

const queueOptionRoutes = Router();
const upload = multer({ dest: 'uploads/' });

queueOptionRoutes.get("/queue-options", isAuth, QueueOptionController.index);

queueOptionRoutes.post("/queue-options", isAuth, upload.array('files'), QueueOptionController.store);

queueOptionRoutes.get("/queue-options/:queueOptionId", isAuth, QueueOptionController.show);

queueOptionRoutes.put("/queue-options/:queueOptionId", isAuth, upload.array('files'), QueueOptionController.update);

queueOptionRoutes.delete("/queue-options/:queueOptionId", isAuth, QueueOptionController.remove);

export default queueOptionRoutes;
