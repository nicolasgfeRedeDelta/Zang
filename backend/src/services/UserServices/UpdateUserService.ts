import * as Yup from "yup";

import AppError from "../../errors/AppError";
import ShowUserService from "./ShowUserService";
import Company from "../../models/Company";
import User from "../../models/User";

interface UserData {
  email?: string;
  newpassworduser?: string;
  name?: string;
  profile?: string;
  viewMessage?: boolean;
  group?: boolean;
  editQueue?: boolean;
  viewChatbot?: boolean;
  companyId?: number;
  queueIds?: number[];
}

interface Request {
  userData: UserData;
  userId: string | number;
  companyId: number;
  requestUserId: number;
}

interface Response {
  id: number;
  name: string;
  email: string;
  profile: string;
  viewMessage: boolean;
  group: boolean;
  editQueue: boolean;
  viewChatbot: boolean;
}

const UpdateUserService = async ({
  userData,
  userId,
  companyId,
  requestUserId
}: Request): Promise<Response | undefined> => {
  const user = await ShowUserService(userId);

  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === false && userData.companyId !== companyId) {
    throw new AppError("O usuário não pertence à esta empresa");
  }

  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    email: Yup.string().email(),
    profile: Yup.string(),
    newpassworduser: Yup.string(),
    viewMessage: Yup.boolean(),
    group:Yup.boolean(),
    editQueue:Yup.boolean(),
  });

  const { email, newpassworduser, profile, name, queueIds = [], viewMessage, group, editQueue, viewChatbot } = userData;

  try {
    await schema.validate({ email, password :newpassworduser, profile, name, viewMessage, group, editQueue, viewChatbot });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  await user.update({
    email,
    password: newpassworduser,
    profile,
    name,
    viewMessage,
    group,
    editQueue,
    viewChatbot,
  });

  await user.$set("queues", queueIds);

  await user.reload();

  const company = await Company.findByPk(user.companyId);

  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    viewMessage: user.viewMessage,
    group: user.group,
    editQueue: user.editQueue,
    viewChatbot: user.viewChatbot,
    companyId: user.companyId,
    company,
    queues: user.queues
  };

  return serializedUser;
};

export default UpdateUserService;
