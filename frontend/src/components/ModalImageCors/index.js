import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";

import ModalImage from "react-modal-image";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
	messageMedia: {
		objectFit: "cover",
		width: 250,
		height: 200,
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
	},
}));

const ModalImageCors = ({ imageUrl, ticketId }) => {
	const classes = useStyles();
	const [fetching, setFetching] = useState(true);
	const [imageBase64Url, setImageBase64Url] = useState("");
	const params = {
		ticketId: ticketId,
		media: imageUrl,
		isDownloadFile: false,
	}
	useEffect(() => {
		if (!imageUrl) return;
		const fetchImage = async () => {
			const { data } = await api.get('/mediaFinder', {
				params: params,
				responseType: "json",
			  });
			const url = `data:image/jpeg;base64,${data.s3Response.mediaBase64}`
			setImageBase64Url(url);
			setFetching(false);
		};
		fetchImage();
	}, [imageUrl]);

	return (
		<ModalImage
			className={classes.messageMedia}
			smallSrcSet={fetching ? imageUrl : imageBase64Url}
			medium={fetching ? imageUrl : imageBase64Url}
			large={fetching ? imageUrl : imageBase64Url}
			alt="image"
		/>
	);
};

export default ModalImageCors;
