import React, { useState, useEffect, useRef, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field, isString } from "formik";
import { toast } from "react-toastify";
import { head } from "lodash";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import UndoRoundedIcon from '@material-ui/icons/UndoRounded';

import { i18n } from "../../translate/i18n";
import moment from "moment";

import whatsBackground from "../../assets/wa-background.png";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import {
  Avatar,
  Box,
  Card,
  CardHeader,
  FormControl,
  FormControlLabel,
  Grid,
  InputBase,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  ThemeProvider,
  Tooltip,
  createTheme,
} from "@material-ui/core";

import { DoneAll, ExpandMore } from "@material-ui/icons";
import MicIcon from "@material-ui/icons/Mic";

import { MoreVert } from "@material-ui/icons";
import { AuthContext } from "../../context/Auth/AuthContext";
import ConfirmationModal from "../ConfirmationModal";
import {
  ModalAudioPreview,
  ModalDownloadPreview,
  ModalImagePreview,
  ModalVideoPreview,
} from "../PreviewMessageCampaign";
import { AudioRecord } from "../AudioRecord";
import MarkdownWrapper from "../MarkdownWrapper";
import SelectContacts from "../SelectContacts";
import TextContacts from "../TextContact";
import useQuickMessages from "../../hooks/useQuickMessages";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import CustomToolTip from "../ToolTips";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },

  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },

  gridRigth: {
    display: "flex",
    flexDirection: "column",
    height: 535,
    width: 400
  },

  buttonChat: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#eee"
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },

  container: {
    display: "flex",
    flexDirection: "row"
  },

  gridContainer: {
    flex: 1,
    height: "100%",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    backgroundColor: "#eee",
  },

  messagesListMessages: {
    width: "100%",
    backgroundImage: `url(${whatsBackground})`,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    height: 390,
    ...theme.scrollbarStyles,
    padding: "20px 20px 20px 20px",
    overflowY: "auto",
  },

  tabsMessages: {
    background: "#f2f2f2",
    border: "1px solid #e6e6e6",
    borderRadius: 2,
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 350,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },

    whiteSpace: "pre-wrap",
    backgroundColor: "#dcf8c6",
    color: "#303030",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999",
  },

  ackDoneAllIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  messageActionsButton: {
    display: "none",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
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

  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 7,
    paddingRight: 7,
  },

  newMessageBox: {
    background: "#eee",
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
  },

  actionButtons: {
    marginRight: 6,
    flex: "none",
    alignSelf: "center",
    marginLeft: "auto",
    "& > *": {
      margin: theme.spacing(0.5),
    },
  },

  messageQuickAnswersWrapper: {
    margin: 0,
    position: "absolute",
    top: "56%",
    background: "#ffffff",
    padding: "2px",
    border: "1px solid #CCC",
    width: "40%",
    left: "33px",
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

const CampaignSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
});

const CampaignModal = ({
  open,
  onClose,
  campaignId,
  initialValues,
  onSave,
  resetPagination,
}) => {
  const classes = useStyles();
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);
  const { companyId } = user;

  const initialState = {
    name: "",
    message1: "",
    message2: "",
    message3: "",
    message4: "",
    message5: "",
    confirmationMessage1: "",
    confirmationMessage2: "",
    confirmationMessage3: "",
    confirmationMessage4: "",
    confirmationMessage5: "",
    status: "INATIVA", // INATIVA, PROGRAMADA, EM_ANDAMENTO, CANCELADA, FINALIZADA,
    confirmation: false,
    scheduledAt: "",
    whatsappId: "",
    contactListId: "",
    companyId,
    mimetype: "",
    queueId: "",
    updateQueue: ""
  };

  const initialMediaPath = {
    name: "",
    type: "",
    base64: "",
    mediaPath: ""
  };

  let values
  let selectedOption
  const [campaign, setCampaign] = useState(initialState);
  const [mediaPath, setMediaPath] = useState(initialMediaPath);
  const [whatsapps, setWhatsapps] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [messageTab, setMessageTab] = useState(0);
  const [attachment, setAttachment] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [campaignEditable, setCampaignEditable] = useState(true);
  const [modalSelectContactOpen, setModalSelectContact] = useState(false);
  const [modalSelectImportText, setModalImportText] = useState(false);
  const attachmentFile = useRef(null);
  const { list: listQuickMessages } = useQuickMessages();
  const [nameListContacts, setNameListContact] = useState("");
  const [message1, setMessage1] = useState("");
  const [message2, setMessage2] = useState("");
  const [message3, setMessage3] = useState("");
  const [message4, setMessage4] = useState("");
  const [message5, setMessage5] = useState("");
  const [responseSelect, setResponseSelect] = useState("");
  const [listContactsText, setListContactsText] = useState("");
  const [quickMessages, setQuickMessages] = useState([]);
  const [typeBar, setTypeBar] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState(quickMessages);

  useEffect(() => {
    async function fetchData() {
      let hasMedia = 0
      const companyId = localStorage.getItem("companyId");
      let messages = await listQuickMessages({ companyId, userId: user.id, modules: "Campanhas" });

      messages.map((message) => {
        message.messages.map((msg) => {
          if (message.messages.length > 6) {
            messages = [];
          } else if (msg.mediaUrl != null) {
            hasMedia = 1;
            if (hasMedia > 1) {
              messages = [];
            }
          }
        })
      });

      const options = messages.map((m, index) => {
        let truncatedShortcode = m.shortcode
        let truncatedMessage = m.messages[0].message == "" ? m.messages[0].mediaUrl : m.messages[0].message;
        if (isString(truncatedMessage) && truncatedMessage.length > 30) {
          truncatedMessage = m.messages[0].message.substring(0, 30) + "...";
        }
        if (isString(truncatedShortcode) && truncatedShortcode.length > 15) {
          truncatedShortcode = m.shortcode.substring(0, 15) + "...";
        }
        if (messages != undefined) {
          values = messages;
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
  }, []);

  let media;
  const handleQuickMessagesClick = (value) => {
    let msg1 = false;// variaveis de controle que dizem se a mensagem ja foi setada nos devidos campos
    let msg2 = false;
    let msg3 = false;
    let msg4 = false;
    let msg5 = false;
    let validatemedia = false;

    value.value.messages.map(async (opt, i) => {
      selectedOption = value;
      if (opt.message) {
        if (opt.message && msg1 === false) {
          setMessage1(opt.message)
          msg1 = true
        } else if (opt.message && msg2 === false) {
          setMessage2(opt.message)
          msg2 = true
        } else if (opt.message && msg3 === false) {
          setMessage3(opt.message)
          msg3 = true
        } else if (opt.message && msg4 === false) {
          setMessage4(opt.message)
          msg4 = true
        } else if (opt.message && msg5 === false) {
          setMessage5(opt.message)
          msg5 = true
        }
      } else if (opt.mediaUrl && !validatemedia) {
        validatemedia = true;
        const params = {
          ticketId: "QuickMessages",
          media: opt.mediaUrl,
          isDownloadFile: false,
        };
        const { data } = await api.get('/mediaFinder', {
          params: params,
          responseType: "json",
        });
        setMediaPath({ name: opt.mediaUrl, type: opt.mimetype, base64: data.s3Response.mediaBase64 });
        setAttachment({ name: opt.mediaUrl, type: opt.mimetype, isQuickMessage: true, mediaPath: opt.mediaUrl });
      }
    })
    setTypeBar(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && typeBar && filteredMessages.length > 0) {
      handleQuickMessagesClick(filteredMessages[0]);
      setTypeBar(false);
    }
  };

  const handleChangeInput = (e, values) => {
    handleLoadQuickMessages(e.target.value);
    filterMessage(e.target.value);
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

  const customTheme = createTheme({
    palette: {
      primary: green,
    }
  });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchMediaData = async (name) => {
      const params = {
        ticketId: "Campaigns",
        media: name,
        isDownloadFile: false,
      };

      try {
        const { data } = await api.get('/mediaFinder', {
          params: params,
          responseType: "json",
        });

        setMediaPath((prevState) => {
          return { ...prevState, base64: data.s3Response.mediaBase64 };
        });
      } catch (error) {
        console.error("Erro ao buscar o base64:", error);
      }
    };

    if ((mediaPath.mediaPath !== "" && mediaPath.name !== null) && mediaPath.base64 === null) {
      fetchMediaData(mediaPath.mediaPath);
    }
  }, [mediaPath]);

  useEffect(() => {
    if (isMounted.current) {
      if (initialValues) {
        setCampaign((prevState) => {
          return { ...prevState, ...initialValues };
        });
      }

      api
        .get(`/contact-lists/list`, { params: { companyId } })
        .then(({ data }) => setContactLists(data));

      api
        .get(`/whatsapp`, { params: { companyId, session: 0 } })
        .then(({ data }) => setWhatsapps(data));

      if (!campaignId) return;

      api.get(`/campaigns/${campaignId}`).then(({ data }) => {
        setCampaign((prev) => {
          let prevCampaignData = Object.assign({}, prev);
          if (data.message1) {
            setMessage1(data.message1);
          }
          if (data.message2) {
            setMessage2(data.message2);
          }
          if (data.message3) {
            setMessage3(data.message3);
          }
          if (data.message4) {
            setMessage4(data.message4);
          }
          if (data.message5) {
            setMessage5(data.message5);
          }
          if (data.mimetype && data.mediaName) {
            setMediaPath({ name: data.mediaName, type: data.mimetype, base64: null, mediaPath: data.mediaPath });
          }
          setResponseSelect(data.contactListId);
          Object.entries(data).forEach(([key, value]) => {
            if (key === "scheduledAt" && value !== "" && value !== null) {
              prevCampaignData[key] = moment(value).format("YYYY-MM-DDTHH:mm");
            } else {
              prevCampaignData[key] = value === null ? "" : value;
            }
          });

          return prevCampaignData;
        });
      });
    }
  }, [campaignId, open, initialValues, companyId]);

  useEffect(() => {
    const now = moment();
    const scheduledAt = moment(campaign.scheduledAt);
    const moreThenAnHour =
      !Number.isNaN(scheduledAt.diff(now)) && scheduledAt.diff(now, "hour") > 1;
    const isEditable =
      campaign.status === "INATIVA" ||
      (campaign.status === "PROGRAMADA" && moreThenAnHour);

    setCampaignEditable(isEditable);
  }, [campaign.status, campaign.scheduledAt]);

  const handleClose = () => {
    onClose();
    setTypeBar(false);
    setCampaign(initialState);
    setMessage1("");
    setMessage2("");
    setMessage3("");
    setMessage4("");
    setMessage5("");
    setMediaPath(initialMediaPath);
    setAttachment(null);
    setResponseSelect("");
  };

  const handleOpenSelectContact = () => {
    setModalSelectContact(true);
  }

  const handleOpenImportText = () => {
    setModalImportText(true);
  }

  const handleAttachmentFile = async (e) => {
    const file = head(e.target.files);
    if (file) {
      const base64 = await getFileBuffer(file);
      setAttachment(file);
      setMediaPath({ name: file.name, type: file.type, base64: base64 });
    }
  };

  const getFileBuffer = async (file) => {
    const url = URL.createObjectURL(file);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const binary = [].slice.call(new Uint8Array(buffer));
    const base64 = window.btoa(binary.map((byte) => String.fromCharCode(byte)).join(''));
    return base64;
  }

  const handleSaveCampaign = async (values) => {
    try {
      if (message1 !== values.message1) {
        values.message1 = message1;
      }
      if (message2 !== values.message2) {
        values.message2 = message2;
      }
      if (message3 !== values.message3) {
        values.message3 = message3;
      }
      if (message4 !== values.message4) {
        values.message4 = message4;
      }
      if (message5 !== values.message5) {
        values.message5 = message5;
      }
      if (responseSelect !== values.contactListId) {
        values.contactListId = responseSelect;
      }
      const dataValues = {};
      Object.entries(values).forEach(([key, value]) => {
        if (key === "scheduledAt" && value !== "" && value !== null) {
          dataValues[key] = moment(value).format("YYYY-MM-DD HH:mm:ss");
        } else {
          dataValues[key] = value === "" ? null : value;
        }
      });

      if (campaignId) {
        await api.put(`/campaigns/${campaignId}`, dataValues);

        if (attachment != null) {
          const formData = new FormData();
          formData.append("file", attachment);
          await api.post(`/campaigns/${campaignId}/media-upload`, formData);
        }
        handleClose();
      } else {
        const { data } = await api.post("/campaigns", dataValues);

        if (attachment != null) {
          const formData = new FormData();
          if (attachment.isQuickMessage === undefined) {
            formData.append("file", attachment);
            await api.post(`/campaigns/${data.id}/media-upload`, formData);
          } else {
            const message = {
              body: attachment
            }
            await api.post(`/campaignsQickMessageMedia/${data.id}`, message);
          }
        }
        if (onSave) {
          onSave(data);
        }
        handleClose();
      }
      toast.success(i18n.t("campaigns.toasts.success"));
    } catch (err) {
      console.log(err);
      toastError(err);
    }
  };

  const deleteMedia = async () => {
    if (attachment) {
      setAttachment(null);
      setMediaPath(initialMediaPath);
      attachmentFile.current.value = null;
    }

    if (campaign.mediaPath) {
      await api.delete(`/campaigns/${campaign.id}/media-upload`);
      setMediaPath(initialMediaPath);
      setCampaign((prev) => ({ ...prev, mediaPath: null, mediaName: null, mimetype: null }));
      toast.success(i18n.t("campaigns.toasts.deleted"));
    }
  };

  const handleChangeContact = (event, contact) => {
    if (event.target.checked) {
      setSelectedContacts((prevSelected) => [...prevSelected, contact]);
    } else {
      setSelectedContacts((prevSelected) => prevSelected.filter((id) => id !== contact));
    }
  };


  const handleSelectContactsChecked = async (ids) => {
    const response = await api.post("/contact-lists", { name: nameListContacts, companyId: companyId })
    const idContactList = response.data.id;
    if (ids.length > 0) {
      const selecionadosIds = selectedContacts.map(item => item.id);
      const aindafalta = ids.filter((id) => !selecionadosIds.includes(id));
      if (aindafalta.length > 0) {
        const formdata = new FormData;
        const idsFormat = ids.map((m) => m.id);
        formdata.append("ids", idsFormat);
        api.post(`/contactsCampaign/listContactsByIds/${idContactList}`, formdata);
      }
    }
    setResponseSelect(idContactList);
    await api
      .get(`/contact-lists/list`, { params: { companyId } })
      .then(({ data }) => {
        setContactLists(data);
      });
    setNameListContact("");
    setSelectedContacts([]);
    setModalSelectContact(false);
  }

  const createdTextContacts = () => {
    const listContactItems = listContactsText.split(";").map(contact => {
      const [number, name, email] = contact.split(",").map(item => item.trim());
      return { number, name, email };
    });
    sendListContacts(listContactItems);
  }

  const sendListContacts = async (listContactItems) => {
    const formDataConatctList = { name: nameListContacts, companyId: companyId }
    try {
      const response = await api.post("/contact-lists", formDataConatctList)

      const idContactList = response.data.id;
      listContactItems.map(async (value, i) => {
        const formDataConatctItem = {
          name: value.name ? value.name : `${nameListContacts} ${i + 1}`,
          number: value.number,
          email: value.email,
          contactListId: idContactList,
          companyId: companyId,
        };
        await api.post("/contact-list-items", formDataConatctItem);
      })
      await api
        .get(`/contact-lists/list`, { params: { companyId } })
        .then(({ data }) => {
          setContactLists(data);
        });
      setResponseSelect(response.data.id);
      setNameListContact("");
      setListContactsText("");
      setModalImportText(false)
      toast.success("Lista de contatos criada.")
    } catch (e) {
      console.error(e);
    }
  }

  const renderMessageField = (identifier, message, setMessage) => {
    return (
      <>
        <Field
          as={TextField}
          id={identifier}
          name={identifier}
          fullWidth
          rows={5}
          label={i18n.t(`campaigns.dialog.form.${identifier}`)}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            handleChangeInput(e, values)
          }}
          placeholder={i18n.t("campaigns.dialog.form.messagePlaceholder")}
          multiline={true}
          variant="outlined"
          helperText="Utilize variáveis como {nome}, {numero}, {email} ou defina variáveis personalizadas."
          disabled={!campaignEditable && campaign.status !== "CANCELADA"}
          onKeyDown={(e) => {
            handleKeyDown(e)
            if (e.shiftKey) return;
            else if (e.key === "Enter") {
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
                  {<a onClick={() => handleQuickMessagesClick(value)}>
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
      </>
    );
  };

  const renderConfirmationMessageField = (identifier) => {
    return (
      <Field
        as={TextField}
        id={identifier}
        name={identifier}
        fullWidth
        rows={5}
        label={i18n.t(`campaigns.dialog.form.${identifier}`)}
        placeholder={i18n.t("campaigns.dialog.form.messagePlaceholder")}
        multiline={true}
        variant="outlined"
        disabled={!campaignEditable && campaign.status !== "CANCELADA"}
      />
    );
  };

  const cancelCampaign = async () => {
    try {
      await api.post(`/campaigns/${campaign.id}/cancel`);
      toast.success(i18n.t("campaigns.toasts.cancel"));
      setCampaign((prev) => ({ ...prev, status: "CANCELADA" }));
      resetPagination();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const restartCampaign = async () => {
    try {
      await api.post(`/campaigns/${campaign.id}/restart`);
      toast.success(i18n.t("campaigns.toasts.restart"));
      setCampaign((prev) => ({ ...prev, status: "EM_ANDAMENTO" }));
      resetPagination();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renderMediaPreviewMessages = (message) => {
    if (message.type === null || message.base64 === null) return;

    if (message.type === "image/png") {
      return (
        <>
          <div className={classes.messageRight}>
            <IconButton
              variant="contained"
              size="small"
              id="messageActionsButton"
              className={classes.messageActionsButton}
            >
              <ExpandMore />
            </IconButton>
            <ModalImagePreview base64={message.base64} />
            <div className={classes.textContentItem}>
              <span className={classes.timestamp}>
                {"00:00"}
                <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
              </span>
            </div>
          </div>
        </>
      )
    }

    if (message.type === "audio/ogg") {
      return (
        <>
          <div className={classes.messageRight}>
            <IconButton
              variant="contained"
              size="small"
              id="messageActionsButton"
              className={classes.messageActionsButton}
            >
              <ExpandMore />
            </IconButton>
            <ModalAudioPreview base64={message.base64} />
            <div className={classes.textContentItem}>
              <span className={classes.timestamp}>
                {"00:00"}
                <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
              </span>
            </div>
          </div>
        </>
      )
    }

    if (message.type === "video/mp4") {
      return (
        <>
          <div className={classes.messageRight}>
            <IconButton
              variant="contained"
              size="small"
              id="messageActionsButton"
              className={classes.messageActionsButton}
            >
              <ExpandMore />
            </IconButton>
            <ModalVideoPreview base64={message.base64} />
            <div className={classes.textContentItem}>
              <span className={classes.timestamp}>
                {"00:00"}
                <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
              </span>
            </div>
          </div>
        </>
      )
    }

    return (
      <>
        <div className={classes.messageRight}>
          <IconButton
            variant="contained"
            size="small"
            id="messageActionsButton"
            className={classes.messageActionsButton}
          >
            <ExpandMore />
          </IconButton>
          <ModalDownloadPreview />
          <div className={classes.textContentItem}>
            <MarkdownWrapper>{message.name}</MarkdownWrapper>
            <span className={classes.timestamp}>
              {"00:00"}
              <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
            </span>
          </div>
        </div>
      </>
    )
  };

  return (
    <div className={classes.root}>
      <ConfirmationModal
        title={i18n.t("campaigns.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={deleteMedia}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {campaignEditable ? (
            <>
              {campaignId
                ? `${i18n.t("campaigns.dialog.update")}`
                : `${i18n.t("campaigns.dialog.new")}`}
            </>
          ) : (
            <>{`${i18n.t("campaigns.dialog.readonly")}`}</>
          )}
        </DialogTitle>
        <div style={{ display: "none" }}>
          <input
            type="file"
            ref={attachmentFile}
            onChange={(e) => handleAttachmentFile(e)}
          />
        </div>
        <Grid
          fullWidth
          direction="row"
        >
          <Formik
            initialValues={campaign}
            enableReinitialize={true}
            validationSchema={CampaignSchema}
            onSubmit={(values, actions) => {
              setTimeout(() => {
                handleSaveCampaign(values);
                actions.setSubmitting(false);
              }, 400);
            }}
          >
            {({ values, errors, touched, isSubmitting }) => (
              <Grid className={classes.container} open={open}>
                <Grid className={classes.gridContainer}>
                  <Form style={{ width: 550 }} >
                    <DialogContent dividers>
                      <Grid spacing={2} container>
                        <Grid xs={12} md={7} item>
                          <Field
                            as={TextField}
                            label={i18n.t("campaigns.dialog.form.name")}
                            name="name"
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name && errors.name}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.textField}
                            disabled={!campaignEditable}
                          />
                        </Grid>
                        <Grid xs={15} md={5} item>
                          <FormControl
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.formControl}
                          >
                            <InputLabel id="confirmation-selection-label">
                              {i18n.t("campaigns.dialog.form.confirmation")}
                            </InputLabel>
                            <Field
                              as={Select}
                              label={i18n.t("campaigns.dialog.form.confirmation")}
                              placeholder={i18n.t(
                                "campaigns.dialog.form.confirmation"
                              )}
                              labelId="confirmation-selection-label"
                              id="confirmation"
                              name="confirmation"
                              error={
                                touched.confirmation && Boolean(errors.confirmation)
                              }
                              disabled={!campaignEditable}
                            >
                              <MenuItem value={false}>Desabilitada</MenuItem>
                              <MenuItem value={true}>Habilitada</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid xs={12} md={5} item>
                          <FormControl
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.formControl}
                          >
                            <InputLabel id="contactList-selection-label">
                              {i18n.t("campaigns.dialog.form.contactList")}
                            </InputLabel>
                            <Field
                              as={Select}
                              label={i18n.t("campaigns.dialog.form.contactList")}
                              placeholder={i18n.t("campaigns.dialog.form.contactList")}
                              labelId="contactList-selection-label"
                              id="contactListId"
                              name="contactListId"
                              error={touched.contactListId && Boolean(errors.contactListId)}
                              disabled={!campaignEditable}
                              value={responseSelect}
                            >
                              <MenuItem value="">Nenhuma</MenuItem>
                              <MenuItem onClick={handleOpenSelectContact}>
                                <strong>Criar nova lista</strong>
                              </MenuItem>
                              <MenuItem onClick={handleOpenImportText}>
                                <strong>Importar com texto</strong>
                              </MenuItem>
                              {contactLists?.map((contactList) => (
                                <MenuItem
                                  key={contactList.id}
                                  value={contactList.id}
                                  onClick={() => setResponseSelect(contactList.id)}
                                >
                                  {contactList.name}
                                </MenuItem>
                              ))}
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid xs={12} md={3} item>
                          <FormControl
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.formControl}
                          >
                            <InputLabel id="whatsapp-selection-label">
                              {i18n.t("campaigns.dialog.form.whatsapp")}
                            </InputLabel>
                            <Field
                              as={Select}
                              label={i18n.t("campaigns.dialog.form.whatsapp")}
                              placeholder={i18n.t("campaigns.dialog.form.whatsapp")}
                              labelId="whatsapp-selection-label"
                              id="whatsappId"
                              name="whatsappId"
                              error={touched.whatsappId && Boolean(errors.whatsappId)}
                              disabled={!campaignEditable}
                            >
                              <MenuItem value="">Nenhuma</MenuItem>
                              {whatsapps &&
                                whatsapps.map((whatsapp) => (
                                  <MenuItem key={whatsapp.id} value={whatsapp.id}>
                                    {whatsapp.name}
                                  </MenuItem>
                                ))}
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid xs={12} md={4} item>
                          <Field
                            as={TextField}
                            label={i18n.t("campaigns.dialog.form.scheduledAt")}
                            name="scheduledAt"
                            error={touched.scheduledAt && Boolean(errors.scheduledAt)}
                            helperText={touched.scheduledAt && errors.scheduledAt}
                            variant="outlined"
                            margin="dense"
                            type="datetime-local"
                            InputLabelProps={{
                              shrink: true,
                            }}
                            fullWidth
                            className={classes.textField}
                            disabled={!campaignEditable}
                          />
                        </Grid>
                        <Grid xs={12} md={5} item>
                          <FormControl
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            className={classes.formControl}
                          >
                            <InputLabel id="queue-selection-label">
                              {i18n.t("campaigns.dialog.form.queue")}
                            </InputLabel>
                            <Field
                              as={Select}
                              label={i18n.t("campaigns.dialog.form.queue")}
                              placeholder={i18n.t("campaigns.dialog.form.queue")}
                              labelId="queue-selection-label"
                              id="queueId"
                              name="queueId"
                              error={touched.queueId && Boolean(errors.queueId)}
                              disabled={!campaignEditable || user.queues.length == 1}
                            >
                              {user.queues?.length == 1 &&
                                <MenuItem key={user.queues[0].id} value={user.queues[0].id}>{user.queues[0].name}</MenuItem>
                              }
                              <MenuItem value="">Nenhuma</MenuItem>
                              {user.queues?.length > 0 &&
                                user.queues.map((queue) => (
                                  <MenuItem key={queue.id} value={queue.id}>
                                    {queue.name}
                                  </MenuItem>
                                ))}
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid container className={classes.btnSwitch} style={{ width: "280px" }}>
                          <Grid item xs={12} container alignItems="center" style={{paddingLeft: "10px"}}>
                            <Grid item xs={8}>
                              <FormControlLabel
                                control={
                                  <Field
                                    as={Switch}
                                    color="primary"
                                    name="updateQueue"
                                    id="updateQueue"
                                  />
                                }
                                label={i18n.t("campaigns.dialog.form.updateQueue")}
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <CustomToolTip
                                title={i18n.t("Ao selecionar esta opção, irá atribuir todos os tickets para a fila que foi selecionada nesta campanha, mesmo que ele já tenha uma fila")}
                                placement="right"
                              >
                                <HelpOutlineOutlinedIcon color="primary" />
                              </CustomToolTip>
                            </Grid>
                          </Grid>
                        </Grid>

                        <Grid xs={12} item>
                          <Tabs
                            className={classes.tabsMessages}
                            value={messageTab}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={(e, v) => setMessageTab(v)}
                            centered

                          >
                            <Tab style={{ minWidth: "20%" }} label="Msg. 1" index={0} />
                            <Tab style={{ minWidth: "20%" }} label="Msg. 2" index={1} />
                            <Tab style={{ minWidth: "20%" }} label="Msg. 3" index={2} />
                            <Tab style={{ minWidth: "20%" }} label="Msg. 4" index={3} />
                            <Tab style={{ minWidth: "20%" }} label="Msg. 5" index={4} />
                          </Tabs>
                          <Box style={{ paddingTop: 20, border: "none" }}>
                            {messageTab === 0 && (
                              <>
                                {values.confirmation ? (
                                  <Grid spacing={2} container>
                                    <Grid xs={12} md={8} item>
                                      {renderMessageField("message1", message1, setMessage1)}
                                    </Grid>
                                    <Grid xs={12} md={4} item>
                                      <>
                                        {renderConfirmationMessageField(
                                          "confirmationMessage1"
                                        )}
                                      </>
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <>{renderMessageField("message1", message1, setMessage1)}</>
                                )}
                              </>
                            )}
                            {messageTab === 1 && (
                              <>
                                {values.confirmation ? (
                                  <Grid spacing={2} container>
                                    <Grid xs={12} md={8} item>
                                      <>{renderMessageField("message2", message2, setMessage2)}</>
                                    </Grid>
                                    <Grid xs={12} md={4} item>
                                      <>
                                        {renderConfirmationMessageField(
                                          "confirmationMessage2"
                                        )}
                                      </>
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <>{renderMessageField("message2", message2, setMessage2)}</>
                                )}
                              </>
                            )}
                            {messageTab === 2 && (
                              <>
                                {values.confirmation ? (
                                  <Grid spacing={2} container>
                                    <Grid xs={12} md={8} item>
                                      <>{renderMessageField("message3", message3, setMessage3)}</>
                                    </Grid>
                                    <Grid xs={12} md={4} item>
                                      <>
                                        {renderConfirmationMessageField(
                                          "confirmationMessage3"
                                        )}
                                      </>
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <>{renderMessageField("message3", message3, setMessage3)}</>
                                )}
                              </>
                            )}
                            {messageTab === 3 && (
                              <>
                                {values.confirmation ? (
                                  <Grid spacing={2} container>
                                    <Grid xs={12} md={8} item>
                                      <>{renderMessageField("message4", message4, setMessage4)}</>
                                    </Grid>
                                    <Grid xs={12} md={4} item>
                                      <>
                                        {renderConfirmationMessageField(
                                          "confirmationMessage4"
                                        )}
                                      </>
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <>{renderMessageField("message4", message4, setMessage4)}</>
                                )}
                              </>
                            )}
                            {messageTab === 4 && (
                              <>
                                {values.confirmation ? (
                                  <Grid spacing={2} container>
                                    <Grid xs={12} md={8} item>
                                      <>{renderMessageField("message5", message5, setMessage5)}</>
                                    </Grid>
                                    <Grid xs={12} md={4} item>
                                      <>
                                        {renderConfirmationMessageField(
                                          "confirmationMessage5"
                                        )}
                                      </>
                                    </Grid>
                                  </Grid>
                                ) : (
                                  <>{renderMessageField("message5", message5, setMessage5)}</>
                                )}
                              </>
                            )}
                          </Box>
                        </Grid>
                        {(campaign.mediaPath || attachment) ? (
                          <Grid xs={12} item>
                            <Button startIcon={<AttachFileIcon />}>
                              {attachment != null
                                ? attachment.name
                                : campaign.mediaName}
                            </Button>
                            {campaignEditable && (
                              <IconButton
                                onClick={() => setConfirmationOpen(true)}
                                color="secondary"
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            )}
                          </Grid>
                        ) : (
                          <div style={{ height: 60, width: "100%" }}>
                          </div>
                        )}
                      </Grid>
                    </DialogContent>
                    <DialogActions>
                      {campaign.status === "CANCELADA" && (
                        <Button
                          color="primary"
                          onClick={() => restartCampaign()}
                          variant="outlined"
                        >
                          {i18n.t("campaigns.dialog.buttons.restart")}
                        </Button>
                      )}
                      {campaign.status === "EM_ANDAMENTO" && (
                        <Button
                          color="primary"
                          onClick={() => cancelCampaign()}
                          variant="outlined"
                        >
                          {i18n.t("campaigns.dialog.buttons.cancel")}
                        </Button>
                      )}
                      {!attachment && !campaign.mediaPath && campaignEditable && (
                        <Button
                          color="primary"
                          onClick={() => attachmentFile.current.click()}
                          disabled={isSubmitting}
                          variant="outlined"
                        >
                          {i18n.t("campaigns.dialog.buttons.attach")}
                        </Button>
                      )}
                      <Button
                        onClick={handleClose}
                        color="secondary"
                        disabled={isSubmitting}
                        variant="outlined"
                      >
                        {i18n.t("campaigns.dialog.buttons.close")}
                      </Button>
                      {(campaignEditable || campaign.status === "CANCELADA") && (
                        <Button
                          type="submit"
                          color="primary"
                          disabled={isSubmitting}
                          variant="contained"
                          className={classes.btnWrapper}
                        >
                          {campaignId
                            ? `${i18n.t("campaigns.dialog.buttons.edit")}`
                            : `${i18n.t("campaigns.dialog.buttons.add")}`}
                          {isSubmitting && (
                            <CircularProgress
                              size={24}
                              className={classes.buttonProgress}
                            />
                          )}
                        </Button>
                      )}
                    </DialogActions>
                  </Form>
                </Grid>
                <Grid className={classes.gridRigth} md={9} item>
                  <div className={classes.buttonChat}>
                    <CardHeader
                      style={{ cursor: "pointer", width: "40%" }}
                      titleTypographyProps={{ noWrap: true }}
                      subheaderTypographyProps={{ noWrap: true }}
                      avatar={<Avatar alt="contact_image" />}
                      title={`nome do usuario`}
                    />
                    <div className={classes.actionButtons}>
                      <Tooltip title={i18n.t("messagesList.header.buttons.return")}>
                        <IconButton >
                          <UndoRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <ThemeProvider theme={customTheme}>
                        <Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
                          <IconButton color="primary">
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      </ThemeProvider>
                      <IconButton >
                        <MoreVert />
                      </IconButton>
                    </div>
                  </div>

                  <div className={classes.messagesListMessages} >
                    {(message1 !== null && (message1.length > 0)) && (
                      <>
                        <div className={classes.messageRight}>
                          <IconButton
                            variant="contained"
                            size="small"
                            id="messageActionsButton"
                            className={classes.messageActionsButton}
                          >
                            <ExpandMore />
                          </IconButton>
                          <div className={classes.textContentItem}>
                            <MarkdownWrapper>{message1}</MarkdownWrapper>
                            <span className={classes.timestamp}>
                              {"00:00"}
                              <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {(message2 !== null && (message2.length > 0)) && (
                      <>
                        <div className={classes.messageRight}>
                          <IconButton
                            variant="contained"
                            size="small"
                            id="messageActionsButton"
                            className={classes.messageActionsButton}
                          >
                            <ExpandMore />
                          </IconButton>
                          <div className={classes.textContentItem}>
                            <MarkdownWrapper>{message2}</MarkdownWrapper>
                            <span className={classes.timestamp}>
                              {"00:00"}
                              <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {(message3 !== null && (message3.length > 0)) && (
                      <>
                        <div className={classes.messageRight}>
                          <IconButton
                            variant="contained"
                            size="small"
                            id="messageActionsButton"
                            className={classes.messageActionsButton}
                          >
                            <ExpandMore />
                          </IconButton>
                          <div className={classes.textContentItem}>
                            <MarkdownWrapper>{message3}</MarkdownWrapper>
                            <span className={classes.timestamp}>
                              {"00:00"}
                              <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {(message4 !== null && (message4.length > 0)) && (
                      <>
                        <div className={classes.messageRight}>
                          <IconButton
                            variant="contained"
                            size="small"
                            id="messageActionsButton"
                            className={classes.messageActionsButton}
                          >
                            <ExpandMore />
                          </IconButton>
                          <div className={classes.textContentItem}>
                            <MarkdownWrapper>{message4}</MarkdownWrapper>
                            <span className={classes.timestamp}>
                              {"00:00"}
                              <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {(message5 !== null && (message5.length > 0)) && (
                      <>
                        <div className={classes.messageRight}>
                          <IconButton
                            variant="contained"
                            size="small"
                            id="messageActionsButton"
                            className={classes.messageActionsButton}
                          >
                            <ExpandMore />
                          </IconButton>
                          <div className={classes.textContentItem}>
                            <MarkdownWrapper>{message5}</MarkdownWrapper>
                            <span className={classes.timestamp}>
                              {"00:00"}
                              <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {(mediaPath.name !== "" && mediaPath.base64 !== "") && (
                      renderMediaPreviewMessages(mediaPath)
                    )}
                  </div>
                  <div className={classes.newMessageBox}>
                    <div className={classes.replyginMsgWrapper}>
                      <div className={classes.messageInputWrapper}>
                        <InputBase
                          className={classes.messageInput}
                          placeholder={"esse campo é somente para pré-visualização das mensagens da sua campanha"}
                          multiline
                          maxRows={5}
                          value={""}
                          disable={true}
                        />
                      </div>
                      <AudioRecord
                        aria-label="showRecorder"
                        component="span"
                        disabled={true}
                      >
                        <MicIcon className={classes.sendMessageIcons} />
                      </AudioRecord>
                    </div>
                  </div>
                </Grid>
              </Grid>
            )}
          </Formik>
        </Grid>
        <SelectContacts
          modalOpen={modalSelectContactOpen}
          handleClose={() => setModalSelectContact(false)}
          handleSave={async (ids, cleanVariables) => {
            if (nameListContacts === "") {
              toast.error("Nome da lista de contato não informado");
            } else if (nameListContacts.length < 3) {
              toast.error("Informe, no mínimo, 3 caracteres no nome da lista.");
            } else {
              await handleSelectContactsChecked(ids);
              cleanVariables();
            }
          }}
          handleChecked={(e, v) => handleChangeContact(e, v)}
          contacts={selectedContacts}
          name={nameListContacts}
          setName={(value) => setNameListContact(value)}
          user={user}
        >
        </SelectContacts>
        <TextContacts
          modalOpen={modalSelectImportText}
          handleClose={() => setModalImportText(false)}
          handleSave={() => {
            if (nameListContacts === "") {
              toast.error("Nome da lista de contato não informado");
            } else if (nameListContacts.length < 3) {
              toast.error("Informe no mínimo 3 caracteres no nome da lista.");
            } else {
              createdTextContacts();
            }
          }}
          name={nameListContacts}
          setName={(value) => setNameListContact(value)}
          value={listContactsText}
          setValue={(value) => setListContactsText(value)}
        >
        </TextContacts>
      </Dialog >
    </div >
  );
};

export default CampaignModal;
