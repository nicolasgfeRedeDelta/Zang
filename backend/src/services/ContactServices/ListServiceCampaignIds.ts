import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { Op, FindOptions, QueryTypes } from 'sequelize';
import sequelize from "../../database";

export interface SearchContactParams {
  companyId: number;
  pageNumber?: string;
  nameFilter: string;
  date: dateFilter;
  selectedQueueIds: number[];
  status: boolean;
}

export interface dateFilter {
  initial: string;
  final: string;
}

interface ContactResponse {
  id: number;
}

const ListServiceCampaignIds = async ({ companyId, date, nameFilter, selectedQueueIds, status }: SearchContactParams): Promise<ContactResponse[]> => {
  const hasfilterDate = (date.initial !== "" || date.final !== "");
  let hasFilter: boolean = false
  if (selectedQueueIds.length != 0 || nameFilter || hasfilterDate) {
    hasFilter = (status || selectedQueueIds.length > 0 || hasfilterDate || nameFilter.length > 3) ? true : false;
  }
  let query = [];
  query.push("select");
  query.push("distinct on(c.name)");
  query.push("c.id");
  query.push("from");
  query.push('"Contacts" c');
  setFilters(hasFilter, query, nameFilter, selectedQueueIds, status, date);
  query.push(`c."isGroup" = false and`);
  query.push(`c."companyId" = ${companyId}`);


  const contacts: ContactResponse[] = await sequelize.query(query.join(' '), {
    type: QueryTypes.SELECT
  });

  if (!contacts) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contacts;
};

const setFilters = (hasFilter: boolean, query: any[], nameFilter: string, selectedQueueIds: number[], status: boolean, date: dateFilter) => {
  if (hasFilter) {
    query.push(`join "Tickets" t on`);
  } else {
    query.push(`left join "Tickets" t on`);
  }
  query.push('c."id" = t."contactId"');
  query.push('where');
  if (nameFilter) {
    query.push(`c."name" ilike '${nameFilter}%' and`);
  }
  if (selectedQueueIds.length > 0) {
    query.push(`t."queueId" in (${selectedQueueIds}) and`);
  }
  if (status === true) {
    query.push(`t."status" <> 'closed' and`);
  } else if (status === false) {
    query.push(`t."status" = 'closed' and`);
  }
  if (date.initial !== "" && date.final !== "") {
    query.push(`t."updatedAt" between '${date.initial}' and '${date.final}' and`)
  }
}

export default ListServiceCampaignIds;
