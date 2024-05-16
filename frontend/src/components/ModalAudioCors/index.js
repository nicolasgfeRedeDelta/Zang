import React, { useState, useEffect } from "react";
import api from "../../services/api";


const ModalAudioCors = ({ audioUrl, ticketId }) => {
	const [audioBase64Url, setAudioBase64Url] = useState("");
	const params = {
		ticketId: ticketId,
		media: audioUrl,
		isDownloadFile: false,
	}
	useEffect(() => {
		if (!audioUrl) return;
		const fetchImage = async () => {
			const { data } = await api.get('/mediaFinder', {
				params: params,
				responseType: "json",
			});
			const url = `data:audio/mp3;base64,${data.s3Response.mediaBase64}`
			setAudioBase64Url(url);
		};
		fetchImage();
	}, [audioUrl]);

	return (
		<audio controls
			src={audioBase64Url} type="audio/mp3">
		</audio>
	);
};

export default ModalAudioCors;
