import express from "express";
import isAuth from "../middleware/isAuth";
import * as QuickMessageController from "../controllers/QuickMessageController";
import multer from "multer";

const routes = express.Router();
const upload = multer({ dest: 'uploads/' });

routes.get("/quick-messages/list", isAuth, QuickMessageController.findList);

routes.get("/quick-messages", isAuth, QuickMessageController.index);

routes.get("/quick-messages/:id", isAuth, QuickMessageController.show);

routes.post("/quick-messages", isAuth, upload.array('files'), QuickMessageController.store);

routes.post("/quick-messages-downloadFiles", isAuth, QuickMessageController.downloadFiles);

routes.put("/quick-messages/:id", isAuth, upload.array('files'), QuickMessageController.update);

routes.delete("/quick-messages/:id", isAuth, QuickMessageController.remove);

export default routes;
