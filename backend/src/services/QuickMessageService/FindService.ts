import { Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";
import Company from "../../models/Company";
import QuickMessageResponse from "../../models/QuickMessageResponse";
import QuickMessageModules from "../../models/QuickMessageModules";

type Params = {
  companyId: string;
  userId: string;
  modules: string;
};


const FindService = async ({ companyId, userId, modules }: Params): Promise<QuickMessage[]> => {
  const whereCondition: any = {
    companyId,
    userId,
  };

  if (modules !== undefined) {
    whereCondition['$modules$'] = { [Op.or]: [modules, null] };
  }

  if (modules != "Agendamentos") {
    const notes: QuickMessage[] = await QuickMessage.findAll({
      where: whereCondition,
      include: [
        {
          model: Company,
          as: "company",
          attributes: ["id", "name"]
        },
        {
          model: QuickMessageResponse,
          as: 'messages',
          separate: true,
          order: [['id', 'ASC']]
        },
        {
          model: QuickMessageModules,
          as: 'modules',
          attributes: ["id", "modules"]
        },
      ],
      order: [["id", "ASC"]]
    });
    return notes;
  } else {
    const notes: QuickMessage[] = await QuickMessage.findAll({
      include: [
        {
          model: Company,
          as: "company",
          attributes: ["id", "name"]
        },
        {
          model: QuickMessageResponse,
          as: 'messages',
          attributes: ['id', 'message', 'mediaUrl', 'timeSendMessage', 'mimetype'],
          separate: true,
          order: [['id', 'ASC']]
        },
        {
          model: QuickMessageModules,
          as: 'modules',
          attributes: ["id", "modules"],
          where: {
            [Op.or]: [
              { modules: modules },
              { modules: null }
            ]
          }
        },
      ],
      order: [["id", "ASC"]]
    });
    return notes;
  };
};

export default FindService;