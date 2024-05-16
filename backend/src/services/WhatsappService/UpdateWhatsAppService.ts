import * as Yup from "yup";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import ShowWhatsAppService from "./ShowWhatsAppService";
import AssociateWhatsappQueue from "./AssociateWhatsappQueue";
import WhatsappsUser from "../../models/WhatsappsUser";

interface WhatsappData {
  name?: string;
  status?: string;
  session?: string;
  isDefault?: boolean;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  queueIds?: number[];
  token?: string;
  color?: string;
  whatsappsUser?: any[],
  whatsappsSelectedUser?: any[]
}

interface Request {
  whatsappData: WhatsappData;
  whatsappId: string;
  companyId: number;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const UpdateWhatsAppService = async ({
  whatsappData,
  whatsappId,
  companyId
}: Request): Promise<Response> => {
  let schema: any
  if (whatsappData.session === undefined) {
    schema = Yup.object().shape({
      name: Yup.string()
        .required()
        .min(2)
        .test(
          "Check-name",
          "Esse nome já está sendo utilizado por outra conexão",
          async value => {
            if (!value) return false;
            const nameExists = await Whatsapp.findOne({
              where: {
                name: value,
                id: { [Op.ne]: whatsappId },
                companyId: companyId
              }
            });
            return !nameExists;
          }
        ),
      color: Yup.string()
        .required()
        .test(
          "Check-color",
          "Esta cor já está sendo usada em outra conexão",
          async value => {
            if (!value) return false;
            const colorExists = await Whatsapp.findOne({
              where: {
                color: value,
                id: { [Op.ne]: whatsappId },
                companyId: companyId
              }
            });
            return !colorExists;
          }
        ),
      isDefault: Yup.boolean(),
      status: Yup.string()
    });
  } else {
    schema = Yup.object().shape({
      name: Yup.string().min(2),
      status: Yup.string(),
      isDefault: Yup.boolean()
    });
  }

  const {
    name,
    status,
    isDefault,
    session,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    ratingMessage,
    queueIds = [],
    token,
    color,
    whatsappsUser,
    whatsappsSelectedUser
  } = whatsappData;


  try {
    await schema.validate({ name, status, isDefault, color });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (queueIds.length > 1 && !greetingMessage) {
    throw new AppError("ERR_WAPP_GREETING_REQUIRED");
  }

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: {
        isDefault: true,
        id: { [Op.not]: whatsappId },
        companyId
      }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false });
    }
  }

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  await whatsapp.update({
    name,
    status,
    session,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    ratingMessage,
    isDefault,
    companyId,
    token,
    color
  });

  try {
    if (whatsappsSelectedUser) {
      let userData = []
        for (let i = 0; i < whatsappsSelectedUser.length; i++) {
          let whatsUser = whatsappsSelectedUser[i];
          userData.push(whatsUser);
          await WhatsappsUser.upsert({ whatsappId: whatsappId, userId: whatsUser });
        }

      await Promise.all(
        whatsappsUser.map(async whatsUserId => {
          let ququeUsers = await WhatsappsUser.findByPk(whatsUserId.id);
          let stillExists: number;
          if (ququeUsers.id) {
            stillExists = -1
          }
          if (stillExists === -1) {
            await WhatsappsUser.destroy({ where: { id: whatsUserId.id } });
          }
        })
      );
    }
  } catch (error) {
    console.error(error)
  }

  await AssociateWhatsappQueue(whatsapp, queueIds);

  return { whatsapp, oldDefaultWhatsapp };
};

export default UpdateWhatsAppService;
