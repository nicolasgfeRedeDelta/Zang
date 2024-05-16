import { useQuery } from "@tanstack/react-query";
import api from "../api";
import toastError from "../../errors/toastError";


function getQueryKey(withUnreadMessages, date) {
  if (!!date) {
    return ['tickets', date];
  } else if (!!withUnreadMessages) {
    return ['tickets', `withUnreadMessages=${withUnreadMessages}`];
  } else {
    return ['tickets'];
  }
}

async function getTickets(
  withUnreadMessages
) {
  try {
    const { data } = await api.get("/tickets", {
      withUnreadMessages,
    })

    return { tickets: data.tickets }
  } catch (error) {
    toastError(error)
    return { tickets: [] }
  }
}

export function useTicketsNotifications({
  withUnreadMessages
}) {
  const queryKey = getQueryKey(withUnreadMessages);
  return useQuery({
    queryKey: queryKey,
    queryFn: () => getTickets(
      withUnreadMessages,
    )
  });
}