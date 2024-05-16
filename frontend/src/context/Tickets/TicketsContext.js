import React, { useState, useEffect, createContext } from "react";
import { useHistory } from "react-router-dom";

const TicketsContext = createContext();
let ticketID// variavel criada para resolver o problema de quando clicava no f12 ou mudava a resolção da tela consultava o ticket com id undefined

const TicketsContextProvider = ({ children }) => {
	const [currentTicket, setCurrentTicket] = useState({ id: null, code: null });
	const history = useHistory();

	if (currentTicket.uuid != undefined) {
		ticketID = currentTicket.uuid;
	}
	useEffect(() => {
		if (currentTicket.id !== null) {
			history.push(`/tickets/${ticketID}`);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTicket])

	return (
		<TicketsContext.Provider
			value={{ currentTicket, setCurrentTicket }}
		>
			{children}
		</TicketsContext.Provider>
	);
};

export { TicketsContext, TicketsContextProvider };
