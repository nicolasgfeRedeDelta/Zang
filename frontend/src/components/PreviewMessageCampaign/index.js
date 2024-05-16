import { Button, Divider } from "@material-ui/core";
import { GetApp } from "@material-ui/icons";
import { makeStyles } from "@material-ui/styles";
import React, { useEffect, useState } from "react";
import ModalImage from "react-modal-image";

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
  downloadMedia: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "inherit",
		padding: 10,
	},
}));


const ModalImagePreview = ({ base64 }) => {
  const classes = useStyles();
  const [fetching, setFetching] = useState(true);
  const [imageBase64Url, setImageBase64Url] = useState("");

  useEffect(() => {
    if (!base64) return;
    const fetchImage = async () => {
      const url = `data:image/jpeg;base64,${base64}`
      setImageBase64Url(url);
      setFetching(false);
    };
    fetchImage();
  }, [base64]);

  return (
    <ModalImage
      className={classes.messageMedia}
      smallSrcSet={fetching ? base64 : imageBase64Url}
      medium={fetching ? base64 : imageBase64Url}
      large={fetching ? base64 : imageBase64Url}
      alt="image"
    />
  );
};

const ModalAudioPreview = ({ base64 }) => {
  const [audioBase64Url, setAudioBase64Url] = useState("");
  useEffect(() => {
    if (!base64) return;
    const fetchImage = async () => {
      const url = `data:audio/mp3;base64,${base64}`
      setAudioBase64Url(url);
    };
    fetchImage();
  }, [base64]);

  return (
    <audio controls
      src={audioBase64Url} type="audio/mp3">
    </audio>
  );
};


const ModalVideoPreview = ({ base64 }) => {
  const classes = useStyles();
  const [videoBase64Url, setVideoBase64Url] = useState("");
  useEffect(() => {
    if (!base64) return;
    const fetchImage = async () => {
      const url = `data:video/mp4;base64,${base64}`
      setVideoBase64Url(url);
    };
    fetchImage();
  }, [base64]);

  return (
    <video
      className={classes.messageMedia}
      src={videoBase64Url}
      type="video/mp4"
      controls
    />
  );
};


const ModalDownloadPreview = () => {
  const classes = useStyles();

  return (
    <>
      <div className={classes.downloadMedia}>
        <Button
          startIcon={<GetApp />}
          color="primary"
          variant="outlined"
          target="_blank"
        >
          Download
        </Button>
      </div>
      <Divider />
    </>
  );
};



export {
  ModalImagePreview,
  ModalAudioPreview,
  ModalVideoPreview,
  ModalDownloadPreview,
}