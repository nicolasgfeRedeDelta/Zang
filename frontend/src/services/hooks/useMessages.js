import { useInfiniteQuery } from '@tanstack/react-query';

import toastError from "../../errors/toastError";

import api from "../api";

function getQueryKey(ticketId) {
  if (!!ticketId) {
    return ['messages', ticketId];
  }
}

async function getMessages({
  pageNumber,
  ticketId
}) {
  if (ticketId) {
    try {
      const { data } = await api.get("/messages/" + ticketId, {
        params: {
          pageNumber,
          ticketId
        },
      });
      return { messages: data.messages, hasMore: data.hasMore };
    } catch (error) {
      toastError(error);
      return { messages: [], hasMore: false };
    }
  }
}

export function useMessages({
  pageNumber,
  ticketId,
}) {
  const queryKey = getQueryKey(ticketId);

  return useInfiniteQuery({
    queryKey: queryKey,
    queryFn: () => getMessages({
      pageNumber,
      ticketId
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