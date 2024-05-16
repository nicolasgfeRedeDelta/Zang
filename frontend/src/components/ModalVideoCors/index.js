import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";

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

const ModalVideoCors = ({ videoUrl, ticketId }) => {
	const classes = useStyles();
	const [videoBase64Url, setVideoBase64Url] = useState("");
	const params = {
		ticketId: ticketId,
		media: videoUrl,
		isDownloadFile: false,
	}
	useEffect(() => {
		if (!videoUrl) return;
		const fetchImage = async () => {
			const { data } = await api.get('/mediaFinder', {
				params: params,
				responseType: "json",
			});
			const url = `data:video/mp4;base64,${data.s3Response.mediaBase64}`
			setVideoBase64Url(url);
		};
		fetchImage();
	}, [videoUrl]);

	return (
        <video
          className={classes.messageMedia}
          src={videoBase64Url}
          type="video/mp4"
          controls
        />
      );
};

export default ModalVideoCors;
