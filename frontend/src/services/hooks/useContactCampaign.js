import { useInfiniteQuery } from '@tanstack/react-query';

import toastError from "../../errors/toastError";

import api from "../api";

function getQueryKey() {
  return ['contacts'];
}

async function getContact({
  pageNumber,
  nameFilter,
  selectedQueueIds,
  date,
  status
}) {
  try {
    const { data } = await api.get("/contactsCampaign/list", {
      params: {
        pageNumber,
        nameFilter,
        selectedQueueIds,
        date,
        status,
      },
    });

    return { contacts: data.contacts, hasMore: data.hasMore, count: data.count };
  } catch (error) {
    toastError(error);
    return { contacts: [], hasMore: false, count: 0 };
  }
}

export function useContactCompaign({
  pageNumber,
  nameFilter,
  selectedQueueIds,
  date,
  status
}) {
  const queryKey = getQueryKey();
  return useInfiniteQuery({
    queryKey: queryKey,
    queryFn: () => getContact({
      pageNumber,
      nameFilter,
      selectedQueueIds,
      date,
      status,
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
