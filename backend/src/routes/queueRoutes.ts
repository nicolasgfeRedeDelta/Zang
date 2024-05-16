import { Router } from "express";
import isAuth from "../middleware/isAuth";
import multer from "multer";
import * as QueueController from "../controllers/QueueController";

const queueRoutes = Router();
const upload = multer({ dest: 'uploads/' });

queueRoutes.get("/queue", isAuth, QueueController.index);

queueRoutes.post("/queue", isAuth ,upload.array('files'), QueueController.store);

queueRoutes.get("/queue/:queueId", isAuth, QueueController.show);

queueRoutes.put("/queue/:queueId", isAuth, upload.array('files'), QueueController.update);

queueRoutes.delete("/queue/:queueId", isAuth, QueueController.remove);

export default queueRoutes;
