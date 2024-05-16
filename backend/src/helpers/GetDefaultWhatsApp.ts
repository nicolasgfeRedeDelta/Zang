import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const GetDefaultWhatsApp = async (companyId: number): Promise<Whatsapp> => {
  const defaultWhatsapp = await Whatsapp.findOne({
    where: { isDefault: true, companyId }
  });

  if (!defaultWhatsapp) {
    const otherWhatsapp = await Whatsapp.findOne({
      where: {
        companyId,
        status: 'CONNECTED'
      }
    });
    if (!otherWhatsapp) {
      throw new AppError("ERR_NO_DEF_WAPP_FOUND");
    }
    return otherWhatsapp;
  }

  return defaultWhatsapp;
};

export default GetDefaultWhatsApp;
