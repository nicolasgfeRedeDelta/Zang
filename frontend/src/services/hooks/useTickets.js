import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import toastError from "../../errors/toastError";

import api from "../api";

function getQueryKey(status) {
  if (!!status) {
    return ['tickets', status];
  } else {
    return ['tickets'];
  }
}

async function getTickets({
  searchParam,
  tags,
  users,
  pageNumber,
  status,
  date,
  updatedAt,
  showAll,
  queueIds,
  withUnreadMessages,
}) {
  try {
    const { data } = await api.get("/tickets", {
      params: {
        searchParam,
        tags,
        users,
        pageNumber,
        status,
        date,
        updatedAt,
        showAll,
        queueIds,
        withUnreadMessages,
      },
    });

    return { tickets: data.tickets, hasMore: data.hasMore };
  } catch (error) {
    toastError(error);
    return { tickets: [], hasMore: false };
  }
}

export function useTickets({
  searchParam,
  tags,
  users,
  pageNumber,
  status,
  date,
  updatedAt,
  showAll,
  queueIds,
  withUnreadMessages,
}) {
  const queryKey = getQueryKey(status);

  return useInfiniteQuery({
    queryKey: queryKey,
    queryFn: () => getTickets({
      searchParam,
      tags,
      users,
      status,
      pageNumber,
      date,
      updatedAt,
      showAll,
      queueIds,
      withUnreadMessages,
    }),
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage && lastPage.nextCursor) {
        return lastPage.nextCursor;
      } else {
        return null;
      }
    }
  })
}
