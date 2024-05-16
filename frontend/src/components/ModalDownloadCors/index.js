import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { Button, Divider } from "@material-ui/core";
import { GetApp } from "@material-ui/icons";
let urlDownload;

const useStyles = makeStyles(theme => ({
	downloadMedia: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "inherit",
		padding: 10,
	},
}));

const handleRemoveMedia = async (mediaName) => {
	const paramsDelete = {
		media: mediaName
	};
	setTimeout(async () => {
		await api.get('/mediaRemove', {
			params: paramsDelete,
			responseType: "json",
		});
	}, 20000);
}

const handleDownload = async (mediaKey, ticketId, mediaName) => {
	const paramsList = {
		ticketId: ticketId,
		media: mediaKey,
		mediaName: mediaName,
		isDownloadFile: true,
	};
	if (!mediaKey) return;
	const fetchImage = async () => {
		urlDownload =  await api.get('/mediaFinder', {
			params: paramsList,
			responseType: "json",
		});
	};
	await fetchImage();
	await handleRemoveMedia(mediaName);
}

const handleButtonClick = async (mediaKey, ticketId, mediaName) => {
	await handleDownload(mediaKey, ticketId, mediaName);
	urlDownload = urlDownload.data.s3Response.mediaUrlDownload
		window.open(urlDownload, "_blank")
};

const ModalDownloadCors = ({ mediaKey, mediaName, ticketId }) => {
	const classes = useStyles();

	return (
		<>
			<div className={classes.downloadMedia}>
				<Button
					startIcon={<GetApp />}
					color="primary"
					variant="outlined"
					target="_blank"
					onClick={() => handleButtonClick(mediaKey, ticketId, mediaName)}
				>
					Download
				</Button>
			</div>
			<Divider />
		</>
	);
};

export default ModalDownloadCors;
