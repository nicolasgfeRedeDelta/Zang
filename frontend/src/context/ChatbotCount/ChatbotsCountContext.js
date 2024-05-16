import React, { createContext, useEffect, useState } from "react";
import api from "../../services/api";
import { socketConnection } from "../../services/socket";

const ChatbotsCountContext = createContext();

const ChatbotsCountProvider = ({ children }) => {
	const [count, setCount] = useState(0);
	const companyId = localStorage.getItem("companyId");

	const socket = socketConnection({ companyId });

	socket.on(`company-${companyId}-ticket-chatbot`, () => {
		handleCount();
	});

	const handleCount = async () => {
		const { data } = await api.get("/tickets-count", {
			params: { status: "chatbot" }
		});
		setCount(data.count);
	}

	useEffect(() => {
		handleCount();
	}, []);

	return (
		<ChatbotsCountContext.Provider
			value={{ count, setCount, handleCount }}
		>
			{children}
		</ChatbotsCountContext.Provider>
	);
};

export { ChatbotsCountContext, ChatbotsCountProvider };
