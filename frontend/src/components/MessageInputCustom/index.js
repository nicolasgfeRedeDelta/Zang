import React, { useState, useEffect, useContext, useRef } from "react";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import MoodIcon from "@material-ui/icons/Mood";
import SendIcon from "@material-ui/icons/Send";
import CancelIcon from "@material-ui/icons/Cancel";
import ClearIcon from "@material-ui/icons/Clear";
import MicIcon from "@material-ui/icons/Mic";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import { FormControlLabel, Switch } from "@material-ui/core";
import { isString } from "lodash";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import RecordingTimer from "./RecordingTimer";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import toastError from "../../errors/toastError";
import useQuickMessages from "../../hooks/useQuickMessages";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMedia } from "../../context/useMedia";
import { FileInput } from "../FileInput";
import { AudioRecord } from "../AudioRecord";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    background: "#eee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },

  newMessageBox: {
    background: "#eee",
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
  },

  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    background: "#fff",
    display: "flex",
    borderRadius: 20,
    flex: 1,
  },

  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
  },

  sendMessageIcons: {
    color: "grey",
  },

  uploadInput: {
    display: "none",
  },

  viewMediaInputWrapper: {
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eee",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },

  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8",
  },

  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },

  audioLoading: {
    color: green[500],
    opacity: "70%",
  },

  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle",
  },

  cancelAudioIcon: {
    color: "red",
  },

  sendAudioIcon: {
    color: "green",
  },

  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 73,
    paddingRight: 7,
  },

  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  replyginMsgBody: {
    padding: 10,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  replyginContactMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  replyginSelfMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  messageQuickAnswersWrapper: {
    margin: 0,
    position: "absolute",
    bottom: "50px",
    background: "#ffffff",
    padding: "2px",
    border: "1px solid #CCC",
    left: 0,
    width: "100%",
    "& li": {
      listStyle: "none",
      "& a": {
        textAlign: "left",
        display: "block",
        padding: "8px",
        textOverflow: "ellipsis",
        overflow: "hidden",
        maxHeight: "32px",
        "&:hover": {
          background: "#F1F1F1",
          cursor: "pointer",
        },
      },
    },
  },

}));
let values
let selectedOption //variaveis globais que foram criadas para ajudar no envio das mensages rapidas
let hasFile //variavel para verificar se possue midia na prmeira mensagem do chatbot

const EmojiOptions = (props) => {
  const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
  const classes = useStyles();
  return (
    <>
      <IconButton
        aria-label="emojiPicker"
        component="span"
        disabled={disabled}
        onClick={(e) => setShowEmoji((prevState) => !prevState)}
      >
        <MoodIcon className={classes.sendMessageIcons} />
      </IconButton>
      {showEmoji ? (
        <div className={classes.emojiBox}>
          <Picker
            perLine={16}
            showPreview={false}
            showSkinTones={false}
            onSelect={handleAddEmoji}
          />
        </div>
      ) : null}
    </>
  );
};

const SignSwitch = (props) => {
  const { width, setSignMessage, signMessage } = props;
  if (isWidthUp("md", width)) {
    return (
      <FormControlLabel
        style={{ marginRight: 7, color: "gray" }}
        label={i18n.t("messagesInput.signMessage")}
        labelPlacement="start"
        control={
          <Switch
            size="small"
            checked={signMessage}
            onChange={(e) => {
              setSignMessage(e.target.checked);
            }}
            name="showAllTickets"
            color="primary"
          />
        }
      />
    );
  }
  return null;
};

const ActionButtons = (props) => {
  const {
    inputMessage,
    loading,
    recording,
    ticketStatus,
    handleSendMessage,
    handleCancelAudio,
    handleUploadAudio,
    handleStartRecording,
  } = props;
  const classes = useStyles();
  if (inputMessage) {
    return (
      <IconButton
        aria-label="sendMessage"
        component="span"
        onClick={handleSendMessage}
        disabled={loading}
      >
        <SendIcon className={classes.sendMessageIcons} />
      </IconButton>
    );
  } else if (recording) {
    return (
      <div className={classes.recorderWrapper}>
        <IconButton
          aria-label="cancelRecording"
          component="span"
          fontSize="large"
          disabled={loading}
          onClick={handleCancelAudio}
        >
          <HighlightOffIcon className={classes.cancelAudioIcon} />
        </IconButton>
        {loading ? (
          <div>
            <CircularProgress className={classes.audioLoading} />
          </div>
        ) : (
          <RecordingTimer />
        )}

        <IconButton
          aria-label="sendRecordedAudio"
          component="span"
          onClick={handleUploadAudio}
          disabled={loading}
        >
          <CheckCircleOutlineIcon className={classes.sendAudioIcon} />
        </IconButton>
      </div>
    );
  } else {
    return (
      <AudioRecord
        aria-label="showRecorder"
        component="span"
        disabled={loading || ticketStatus !== "open"}
        handleStartRecording={handleStartRecording}
      >
        <MicIcon className={classes.sendMessageIcons} />
      </AudioRecord>
    );
  }
};

const CustomInput = (props) => {
  const {
    loading,
    setLoading,
    inputRef,
    ticketStatus,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleInputPaste,
    recording,
    setQuickMessagesValue,
  } = props;
  const classes = useStyles();
  const [quickMessages, setQuickMessages] = useState([]);
  const [typeBar, setTypeBar] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState(quickMessages);
  const { user } = useContext(AuthContext);
  const { list: listQuickMessages } = useQuickMessages();
  let sendMessageWithEnter = false

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem("companyId");
      const messages = await listQuickMessages({ companyId, userId: user.id, modules: "Atendimentos" });
      const options = messages.map((m, index) => {
        let truncatedShortcode = m.shortcode
        let truncatedMessage = m.messages[0].message === null ? m.messages[0].mediaUrl : m.messages[0].message;
        if (isString(m.messages[0].mediaUrl) && m.messages[0].mediaUrl.length > 30) {
          truncatedMessage = m.messages[0].mediaUrl.substring(0, 30) + "...";
        } else if ((isString(m.messages[0].message) && m.messages[0].message.length > 30)) {
          truncatedMessage = m.messages[0].message.substring(0, 30) + "...";
        }
        if (isString(truncatedShortcode) && truncatedShortcode.length > 15) {
          truncatedShortcode = m.shortcode.substring(0, 15) + "...";
        }
        if (messages != undefined) {
          values = messages
        }

        return {
          value: "",
          color: m.color,
          shortcode: truncatedShortcode,
          label: `/${m.shortcode}`,
          id: m.id,
          truncatedMessage: `${truncatedMessage}`,
        };
      });
      values != undefined &&
        values.map((msg, index) => {
          if (options.length > 0) {
            options[index].value = msg
          }
        })
      setQuickMessages(options);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formateSingleMessage = (opt) => {
    let singleMessageFormated
    if (opt != null) {
      if (opt.message != null && opt.mediaUrl === null) {
        singleMessageFormated = opt.message
      } else if (opt.mediaUrl != null && opt.message === null) {
        singleMessageFormated = ''
      } else if (opt.mediaUrl != null && opt.message != null) {
        singleMessageFormated = `${opt.mediaUrl} \n${opt.message}`
      }
    }
    return singleMessageFormated
  }

  const onPaste = (e) => {
    if (ticketStatus === "open") {
      handleInputPaste(e);
    }
  };

  const filterMessage = (values) => {
    let valueFormated = values.slice(1);
    const filtered = quickMessages.filter((message) =>
      message.shortcode.trim().toLowerCase().includes(valueFormated.toLowerCase())
    );
    if (filtered.length === 0) {
      setTypeBar(false)
    } else {
      setFilteredMessages(filtered);
    }
  }

  const handleChangeInput = (e) => {
    setInputMessage(e.target.value);
    handleLoadQuickMessages(e.target.value);
    filterMessage(e.target.value);
  };

  const downloadS3Files = async (message) => {
    await api.post(`/quick-messages-downloadFiles`, message);
  }

  const handleQuickMessagesClick = async (value) => {
    value.value.messages.map(async (opt) => {
      await downloadS3Files(opt);
      if (value.value.messages.length === 1) {
        selectedOption = value
        if (value.value.messages[0].mediaUrl != null) {
          hasFile = true;
        }
        setQuickMessagesValue(value.value.messages)
        setInputMessage(formateSingleMessage(opt));
      } else {
        selectedOption = value
        setQuickMessagesValue(value.value.messages)
        setInputMessage('');
      }
      setTimeout(() => {
        inputRef.current.scrollTop = inputRef.current.scrollHeight;
      }, 200);
    })
    setTypeBar(false);
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const handleLoadQuickMessages = async (value) => {
    if (value && value.indexOf("/") === 0) {
      try {
        if (quickMessages.length > 0) {
          setTypeBar(true);
        } else {
          setTypeBar(false);
        }
      } catch (err) {
        setTypeBar(false);
      }
    } else {
      setTypeBar(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && typeBar && filteredMessages.length > 0) {
      setLoading(true);
      handleQuickMessagesClick(filteredMessages[0]);
    }
  };

  return (
    <div className={classes.messageInputWrapper}>
      <InputBase
        inputRef={(input) => {
          input && input.focus();
          input && (inputRef.current = input);
        }}
        className={classes.messageInput}
        placeholder={
          ticketStatus === "open" || user.group === true
            ? i18n.t("messagesInput.placeholderOpen")
            : i18n.t("messagesInput.placeholderClosed")
        }
        multiline
        maxRows={5}
        value={inputMessage}
        disabled={recording}
        onChange={handleChangeInput}
        onPaste={(e) => {
          ticketStatus === "open" && handleInputPaste(e);
        }}
        onKeyDown={(e) => {
          handleKeyDown(e)
          if (loading || e.shiftKey) return;
          else if (e.key === "Enter") {
            if (!typeBar) {
              handleSendMessage();
            };
            e.preventDefault()
            setTypeBar(false);
          }
        }}
      />
      {typeBar ? (
        <ul
          className={classes.messageQuickAnswersWrapper}>
          {filteredMessages.map((value, index) => {
            return (
              <li
                className={classes.messageQuickAnswersWrapperItem}
                key={index}
              >
                {<a onClick={() => {
                  setLoading(true);
                  handleQuickMessagesClick(value);
                }}>
                  <text style={{ WebkitTextFillColor: value.color }}>
                    {`${value.shortcode}`}</text> - {value.truncatedMessage}
                </a>}
              </li>
            );
          })}
        </ul>
      ) : (
        <div></div>
      )}
    </div>
  );
};

const MessageInputCustom = (props) => {
  const { ticketStatus, ticketId } = props;
  const classes = useStyles();
  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef();
  const { setReplyingMessage, replyingMessage } = useContext(ReplyMessageContext);
  const { user } = useContext(AuthContext);
  const [signMessage, setSignMessage] = useLocalStorage("signOption", true);
  const [quickMessagesValue, setQuickMessagesValue] = useState([]);

  const { medias, handleChangeMedias, loading, setLoading, cleanMedia } = useMedia();
  const sendIconRef = useRef(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    inputRef.current.focus();
  }, [replyingMessage]);

  useEffect(() => {
    inputRef.current.focus();
    return () => {
      setInputMessage("");
      setShowEmoji(false);
      setReplyingMessage(null);
    };
  }, [ticketId, setReplyingMessage]);

  const { mutate } = useMutation(
    async (message) => {
      await api.post(`/messages/${ticketId}`, message);
    }
  )

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files) {
      handleChangeMedias(e.clipboardData.files);
    }
  };

  const handleUploadMedia = async (e) => {
    setLoading(true);
    e.preventDefault();

    const formData = new FormData();
    formData.append("fromMe", true);
    medias.forEach((media) => {
      formData.append("medias", media);
      formData.append("body", media.name);
    });

    try {
      mutate(formData);
    } catch (err) {
      toastError(err);
    }

    setLoading(false);
    cleanMedia();
  };

  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  const handleUploadQuickMessage = async (e) => {
    hasFile = false;
    setLoading(true);
    e.preventDefault();

    try {
    await sendQuickMessages(quickMessagesValue);
      setQuickMessagesValue([]);
    } catch (err) {
      toastError(err);
    }

    setLoading(false);
  };

  async function sendQuickMessages(quickMessages, index = 0) {
    if (index >= quickMessages.length) {
      // Todas as mensagens ja foram enviadas
      return;
    }

    const msg = quickMessages[index];
    msg['isQuickMessage'] = true;
    const message = {
      fromMe: true,
      body: msg ? msg : inputMessage.trim(),
      quotedMsg: msg,
    };

    try {
      if (msg.message) {
        await api.post(`/messages/${ticketId}`, message);
      } else {
        await api.post(`/messagesMedia/${ticketId}`, message);
      }
    } catch (err) {
      toastError(err);
    }
    await sendQuickMessages(quickMessages, index + 1);
  }
  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    setLoading(true);

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: signMessage
        ? `*${user?.name}:*\n${inputMessage.trim()}`
        : inputMessage.trim(),
      quotedMsg: replyingMessage,
    };
    try {
      await api.post(`/messages/${ticketId}`, message);
    } catch (err) {
      toastError(err);
    }

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();
      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `audio-record-site-${new Date().getTime()}.mpeg`;
      formData.append("medias", blob, filename);
      formData.append("body", filename);
      formData.append("fromMe", true);

      mutate(formData);
    } catch (err) {
      toastError(err);
    }

    setRecording(false);
    setLoading(false);
  };

  const handleCancelAudio = async () => {
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const disableOption = () => {
    return loading || recording || (ticketStatus !== "open" && ticketStatus !== "group");
  };

  useEffect(() => {
    if (sendIconRef.current) {
      sendIconRef.current.focus();
    }
  }, [medias, quickMessagesValue]);

  const renderReplyingMessage = (message) => {
    return (
      <div className={classes.replyginMsgWrapper}>
        <div className={classes.replyginMsgContainer}>
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe,
            })}
          ></span>
          <div className={classes.replyginMsgBody}>
            {!message.fromMe && (
              <span className={classes.messageContactName}>
                {message.contact?.name}
              </span>
            )}
            {message.body}
          </div>
        </div>
        <IconButton
          aria-label="showRecorder"
          component="span"
          disabled={loading || ticketStatus !== "open"}
          onClick={() => setReplyingMessage(null)}
        >
          <ClearIcon className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };
  if (medias.length > 0)
    return (
      <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
        <IconButton
          aria-label="cancel-upload"
          component="span"
          onClick={() => cleanMedia()}
        >
          <CancelIcon className={classes.sendMessageIcons} />
        </IconButton>

        {loading ? (
          <div>
            <CircularProgress className={classes.circleLoading} />
          </div>
        ) : (
          <>
            {medias.length > 1 ? (
              <span>
                {medias[0]?.name} + {medias.length - 1}
              </span>
            ) : (
              <span>
                {medias[0]?.name}
              </span>
            )}
          </>
        )}
        <IconButton
          aria-label="send-upload"
          component="span"
          onClick={(e) => handleUploadMedia(e)}
          disabled={loading || ticketStatus === "closed"}
          ref={sendIconRef}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      </Paper>
    );
  else if (quickMessagesValue.length > 1 || hasFile === true)
    return (
      <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
        <IconButton
          aria-label="cancel-upload"
          component="span"
          onClick={(e) => setQuickMessagesValue([])}
        >
          <CancelIcon className={classes.sendMessageIcons} />
        </IconButton>

        {loading ? (
          <div>
            <CircularProgress className={classes.circleLoading} />
          </div>
        ) : (
          <span>
            {selectedOption.shortcode}
          </span>
        )}
        <IconButton
          aria-label="send-upload"
          component="span"
          onClick={handleUploadQuickMessage}
          disabled={loading}
          ref={sendIconRef}
        >
          <SendIcon className={classes.sendMessageIcons} />
        </IconButton>
      </Paper>
    );
  else {
    return (
      <Paper square elevation={0} className={classes.mainWrapper}>
        {replyingMessage && renderReplyingMessage(replyingMessage)}
        <div className={classes.newMessageBox}>
          <EmojiOptions
            disabled={disableOption()}
            handleAddEmoji={handleAddEmoji}
            showEmoji={showEmoji}
            setShowEmoji={setShowEmoji}
          />

          <FileInput
            disableOption={disableOption()}
            handleChangeMedias={(e) => handleChangeMedias(e.target.files)}
          />

          <SignSwitch
            width={props.width}
            setSignMessage={setSignMessage}
            signMessage={signMessage}
          />

          <CustomInput
            setFilteredMessages
            loading={loading}
            setLoading={setLoading}
            inputRef={inputRef}
            ticketStatus={ticketStatus}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            setQuickMessagesValue={setQuickMessagesValue}
            handleSendMessage={handleSendMessage}
            handleInputPaste={handleInputPaste}
            recording={recording}
          />

          <ActionButtons
            inputMessage={inputMessage}
            loading={loading}
            recording={recording}
            ticketStatus={ticketStatus}
            handleSendMessage={handleSendMessage}
            handleCancelAudio={handleCancelAudio}
            handleUploadAudio={handleUploadAudio}
            handleStartRecording={handleStartRecording}
          />
        </div>
      </Paper>
    );
  }
};

export default withWidth()(MessageInputCustom);