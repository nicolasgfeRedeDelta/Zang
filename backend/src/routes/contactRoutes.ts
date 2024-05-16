import express from "express";
import isAuth from "../middleware/isAuth";

import * as ContactController from "../controllers/ContactController";
import * as ImportPhoneContactsController from "../controllers/ImportPhoneContactsController";
import multer from "multer";

const contactRoutes = express.Router();
const upload = multer({ dest: 'uploads/' });

contactRoutes.post(
  "/contacts/import",
  isAuth,
  ImportPhoneContactsController.store
);

contactRoutes.get("/contacts", isAuth, ContactController.index);

contactRoutes.get("/contacts/list", isAuth, ContactController.list);

contactRoutes.get("/contactsCampaign/list", isAuth, ContactController.listCampaing);

contactRoutes.get("/contactsCampaign/listIds", isAuth, ContactController.listCampaingIds);

contactRoutes.post("/contactsCampaign/listContactsByIds/:id", isAuth, upload.array('ids'), ContactController.listContactsByIds);

contactRoutes.get("/contacts/:contactId", isAuth, ContactController.show);

contactRoutes.post("/contacts", isAuth, ContactController.store);

contactRoutes.put("/contacts/:contactId", isAuth, ContactController.update);

contactRoutes.delete("/contacts/:contactId", isAuth, ContactController.remove);

export default contactRoutes;
