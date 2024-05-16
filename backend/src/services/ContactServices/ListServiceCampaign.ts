import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { Op, FindOptions, QueryTypes, WhereOptions } from 'sequelize';
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
  number: string;
  name: string;
  status?: string;
  ticketAt?: Date;
  ticketQueue?: number;
}

interface Response {
  contacts: ContactResponse[],
  hasMore: boolean;
  count: number;
}

const ListServiceCampaign = async ({
  companyId,
  pageNumber,
  nameFilter,
  status,
  selectedQueueIds,
  date
}: SearchContactParams): Promise<Response> => {
  const hasfilterDate = (date.initial !== "" || date.final !== "");
  let hasFilter: boolean = false
  if (selectedQueueIds.length != 0 || nameFilter || hasfilterDate) {
    hasFilter = (status || selectedQueueIds.length > 0 || hasfilterDate || nameFilter.length > 3) ? true : false;
  }

  const limit = 30;
  const offset = limit * (+pageNumber - 1);

  let countQuery = [];
  let query = [];
  query.push("select");
  query.push("distinct on(c.name)");
  query.push("c.id,");
  query.push('c."number",');
  query.push('c."name",');
  query.push('t."status",');
  query.push('t."queueId" as ticketQueue,');
  query.push('t."updatedAt" as ticketAt');
  query.push("from");
  query.push('"Contacts" c');
  setFilters(hasFilter, query, nameFilter, selectedQueueIds, status, date);
  query.push(`c."isGroup" = false and`);
  query.push(`c."companyId" = ${companyId}`);
  setCount(countQuery, query);
  query.push(`limit ${limit}`);
  query.push(`offset ${offset}`);

  const contacts: ContactResponse[] = await sequelize.query(query.join(' '), {
    type: QueryTypes.SELECT
  });
  const response: any = await sequelize.query(countQuery.join(' '), {
    type: QueryTypes.SELECT
  });
  const count = response[0].count;

  if (!contacts) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }
  const hasMore = count > offset + contacts.length;

  return { contacts, hasMore, count };
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
  }
  if (status === false) {
    query.push(`t."status" = 'closed' and`);
  }
  if (date.initial !== "" && date.final !== "") {
    query.push(`t."updatedAt" between '${date.initial}' and '${date.final}' and`)
  }
}

const setCount = (countQuery: any[], query: any[]) => {
  countQuery.push("select COUNT(*) from (");
  countQuery.push(query.join(' '));
  countQuery.push(") as subquery");
}

export default ListServiceCampaign;
