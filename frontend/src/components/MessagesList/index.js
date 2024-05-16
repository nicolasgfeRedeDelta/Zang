import React, { useState, useEffect, useReducer, useRef, useContext } from "react";

import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";

import { green } from "@material-ui/core/colors";
import {
  Avatar,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  debounce,
  makeStyles,
} from "@material-ui/core";

import {
  AccessTime,
  Block,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
} from "@material-ui/icons";

import MarkdownWrapper from "../MarkdownWrapper";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";

import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";
import { useMessages } from "../../services/hooks/useMessages";
import { useMedia } from "../../context/useMedia";
import ModalVideoCors from "../ModalVideoCors";
import ModalAudioCors from "../ModalAudioCors";
import ModalDownloadCors from "../ModalDownloadCors";
import { PageNumberContext } from "../../context/Pagenumber/PagenumberContext";
import api from "../../services/api";
import NewTicketModal from "../NewTicketModal";
import { useHistory } from "react-router-dom";
import ConfirmationModal from "../ConfirmationModal";
import SelectQueueModal from "../SelectQueueModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { ChatbotsCountContext } from "../../context/ChatbotCount/ChatbotsCountContext";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 200,
  },

  messagesList: {
    backgroundImage: `url(${whatsBackground})`,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },

  messagesListMessages: {
    backgroundImage: `url(${whatsBackground})`,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    ...theme.scrollbarStyles,
    padding: "20px 20px 20px 20px",
  },

  circleLoading: {
    color: green[500],
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },

  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
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
    backgroundColor: "#ffffff",
    color: "#303030",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },

  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsg: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },

  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },

  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
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

  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: "#cfe9ba",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },

  quotedMsgRight: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },

  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },

  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },

  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },

  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
    position: "relative",
  },

  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },

  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999",
  },

  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },

  dailyTimestampText: {
    color: "#808888",
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },

  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },

  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },

  ackDoneAllIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  }

}));

const reducer = (state, action) => {
  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      state[messageIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    if (state.length > 20) {
      const newListMessage = state.slice(state.length - 21, state.length);
      return [...newListMessage];
    }
    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      state[messageIndex] = messageToUpdate;
    }

    if (state.length > 20) {
      const newListMessage = state.slice(state.length - 21, state.length);
      return [...newListMessage];
    }
    return [...state];
  }

  if (action.type === "NEXT_PAGE_TICKET") {
    if (action.pages > 1) {
      return [...action.payload, ...state];
    } else {
      return [...action.payload];
    }
  }

  if (action.type === "RESET") {
    return [];
  }
};


const MessagesList = ({ ticket, ticketId, isGroup }) => {
  const classes = useStyles();
  const history = useHistory();
  const queryClient = useQueryClient();

  const [messagesList, dispatch] = useReducer(reducer, []);
  const { pageNumber, setPageNumber } = useContext(PageNumberContext);
  const { user } = useContext(AuthContext);
  const { handleCount } = useContext(ChatbotsCountContext);
  const [hasMore, setHasMore] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [openSelectQueue, setOpenSelectQueue] = useState(false);
  const [openConfirmaPending, setOpenConfirmPending] = useState(false);
  const [modalQueueOpen, setModalQueueOpen] = useState(false);
  const lastMessageRef = useRef();
  const { handleChangeMedias } = useMedia();
  const [ticketPending, setTicketPending] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);
  const [selectedMessage, setSelectedMessage] = useState({});
  const [newContact, setNewContact] = useState({});

  const { data, isloading, fetchNextPage } = useMessages({
    pageNumber,
    ticketId
  });

  useEffect(() => {
    if (pageNumber > 1) {
      fetchNextPage();
    };
  }, [pageNumber]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
    currentTicketId.current = ticketId;
  }, [ticketId]);

  useEffect(() => {
    if (!data || data && !data.pages[data.pages.length - 1]) return;
    if (pageNumber === 1) {
      data.pages.splice(1);
    }
    if (pageNumber === 1 && data.pages[data.pages.length - 1].messages.length > 1) {
      scrollToBottom();
    }
  }, [messagesList]);

  useEffect(() => {
    if (!ticketId) return;
    if (!data) return;
    try {
      if (pageNumber === 1) {
        data.pages.splice(1);
      }
      const newMessages = data.pages[data.pages.length - 1].messages;
      setHasMore(data.pages[data.pages.length - 1].hasMore);
      dispatch({ type: 'NEXT_PAGE_TICKET', payload: newMessages, pages: data.pages.length })
    } catch (err) {
      isloading = false;
      toastError(err);
    }
  }, [data]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on("connect", () => socket.emit("joinChatBox", `${ticket.id}`));

    socket.on(`company-${companyId}-appMessage`, (data) => {
      if (data.action === "create") {
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        scrollToBottom();
      }

      if (data.action === "update") {
        dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
        scrollToBottom();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket]);

  const loadMore = debounce(() => {
    if (hasMore) {
      setPageNumber(pageNumber + 1);
    }
  }, 300);

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({});
    }
  };

  const handleScroll = (e) => {
    if (!hasMore) return;
    const { scrollTop } = e.currentTarget;

    if (scrollTop === 0) {
      document.getElementById("messagesList").scrollTop = 1;
    }

    if (isloading) {
      return;
    }

    if (scrollTop < 50) {
      loadMore();
    }
  };

  const handleOpenMessageOptionsMenu = (e, message) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMessageOptionsMenu = (e) => {
    setAnchorEl(null);
  };

  const checkMessageMedia = (message) => {
  
    if (message.mediaType === "image") {
      return <ModalImageCors imageUrl={message.body} ticketId={ticketId} />;
    }
    if (message.mediaType === "audio") {
      return <ModalAudioCors audioUrl={message.body} ticketId={ticketId} />;
    }
    if (message.mediaType === "video") {
      return <ModalVideoCors videoUrl={message.body} ticketId={ticketId} />;
    } else {
      return <ModalDownloadCors mediaKey={message.mediaUrl} mediaName={message.body} ticketId={ticketId} />;
    }
  };

  const renderMessageAck = (message) => {
    if (message.ack === 0) {
      return <AccessTime fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 1) {
      return <Done fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 3) {
      return <DoneAll fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 4 || message.ack === 4) {
      return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} />;
    }
  };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < messagesList.length - 1) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
    if (index === messagesList.length - 1) {
      return (
        <div
          key={`ref-${message.createdAt}`}
          ref={lastMessageRef}
          style={{ float: "left", clear: "both" }}
        />
      );
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;

      if (messageUser !== previousMessageUser) {
        return (
          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const renderQuotedMessage = (message) => {
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}
          {message.quotedMsg?.body}
        </div>
      </div>
    );
  };

  const renderMessageContact = (contact) => {
    return (
      <div>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div style={{ width: 50, height: 50 }}>
            <Avatar alt="contact_image" />
          </div>
          <div style={{ width: 200 }}>
            <span style={{ fontWeight: "bold", fontSize: 16 }}>
              {contact.name}
            </span>
            <br />
            <span style={{ fontSize: 12 }}>
              +{contact.number?.slice(0, 2)} ({contact.number?.slice(2, 4)}) {contact.number?.slice(4, 8)}-{contact.number?.slice(8, 14)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCardContact = (contact) => {
    return (
      <>
        <Divider />
        <span
          style={{ display: "flex", justifyContent: "center", height: 25 }}
          type="button"
        >
          <Button
            onClick={() => handleCreatedContactTicket(contact)}
            style={{ width: "100%" }}
          >
            {i18n.t("messagesList.contact.initialChat")}
          </Button>
          <NewTicketModal
            initialContact={newContact}
            modalOpen={openSelectQueue}
            onClose={(ticket) => handleCloseNewTicketModal(ticket)}
          />
        </span>
        <ConfirmationModal
          open={openConfirmaPending}
          onClose={() => setOpenConfirmPending(false)}
          title={i18n.t("messagesList.contact.confirmationModal.title")}
          onConfirm={() => {
            if (user.queues.length > 1) {
              setModalQueueOpen(true);
            } else {
              handleSetQueueTicket(ticketPending.id);
            }
          }}
        >
          {i18n.t("messagesList.contact.confirmationModal.accept")}
        </ConfirmationModal>
        <SelectQueueModal
          modalOpen={modalQueueOpen}
          handleClose={() => setModalQueueOpen(false)}
          onClick={(queueId) => handleSetQueueTicket(ticketPending, queueId)}
        />
      </>
    )
  }

  const handleCloseNewTicketModal = (ticket) => {
    setOpenSelectQueue(false);
    queryClient.invalidateQueries(["tickets", "open"]);
    queryClient.invalidateQueries(["tickets", "pending"]);
    queryClient.invalidateQueries(["tickets", "chatbot"]);
    if (ticket !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  }

  const handleSetQueueTicket = async (ticket, queueId) => {
    let selectedQueue;
    if (user.queues.length === 1) {
      selectedQueue = user.queues[0].id;
    } else {
      selectedQueue = queueId;
    }
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "open",
        userId: user?.id,
        accepModal: true,
        queueId: selectedQueue
      });
      queryClient.invalidateQueries(["tickets", "open"]);
      queryClient.invalidateQueries(["tickets", "pending"]);
      queryClient.invalidateQueries(["tickets", "chatbot"]);
      handleCount();
    } catch (err) {
      toastError(err);
    }
    history.push(`/tickets/${ticket.uuid}`);
  };

  const handleCreatedContactTicket = async (contact) => {
    const number = contact.number;
    const name = contact.name;
    const { data: contactData } = await api.get("/contacts/", {
      params: { searchParam: number, pageNumber: 1 },
    });
    if (contactData.count === 0) {
      await api.post("/contacts", { name, number }).then((value) => {
        setNewContact(value.data);
      });
      setOpenSelectQueue(true);
    } else {
      const { data: responseTicket } = await api.get("/ticketsContact/", {
        params: { contactId: contactData.contacts[0].id }
      });
      if (responseTicket.tickets[0].status === "open") {
        if (user.profile === "admin") {
          history.push(`/tickets/${responseTicket.tickets[0].uuid}`);
        } else if (user.profile === "user" && user.id === responseTicket.tickets[0].userId) {
          history.push(`/tickets/${responseTicket.tickets[0].uuid}`);
        } else {
          toastError("Há um ticket aberto desse contato atribuído a outro usuário, peça-o para fechar ou deletar o ticket");
        }
      } else if (responseTicket.tickets[0].status === "pending") {
        setOpenConfirmPending(true);
        setNewContact(responseTicket.tickets[0].contact);
        setTicketPending(responseTicket.tickets[0])
      } else {
        setNewContact(contactData.contacts[0]);
        setOpenSelectQueue(true)
      }
    }
  }

  const renderMessages = () => {
    if (messagesList.length > 0) {
      const viewMessagesList = messagesList.map((message, index) => {
        let contact;
        if (message.mediaType === "contactMessage") {
          const [name, number] = message.body?.split(", ");
          contact = { name, number };
        }
        if (!message.fromMe) {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={classes.messageLeft}
                title={message.queueId && message.queue?.name}
              >
                <div>
                  <IconButton
                    variant="contained"
                    size="small"
                    id="messageActionsButton"
                    disabled={message.isDeleted}
                    className={classes.messageActionsButton}
                    onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                  >
                    <ExpandMore />
                  </IconButton>
                  {isGroup && (
                    <span className={classes.messageContactName}>
                      {message.contact?.name}
                    </span>
                  )}
                  {message.mediaUrl && checkMessageMedia(message)}
                  <div className={classes.textContentItem}>
                    {message.quotedMsg && renderQuotedMessage(message)}
                    {message.mediaType === "contactMessage" && (
                      renderMessageContact(contact)
                    )}
                    {message.mediaType !== "contactMessage" && <MarkdownWrapper>{message.body}</MarkdownWrapper>}
                    <span className={classes.timestamp}>
                      {format(parseISO(message.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
                {message.mediaType === "contactMessage" && renderCardContact(contact)}
              </div>
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderMessageDivider(message, index)}
              <div
                className={classes.messageRight}
                title={message.queueId && message.queue?.name}
              >
                <div>
                  <IconButton
                    variant="contained"
                    size="small"
                    id="messageActionsButton"
                    disabled={message.isDeleted}
                    className={classes.messageActionsButton}
                    onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                  >
                    <ExpandMore />
                  </IconButton>
                  {isGroup && (
                    <span className={classes.messageContactName}>
                      {message.contact?.name}
                    </span>
                  )}
                  {message.mediaUrl && checkMessageMedia(message)}
                  <div className={classes.textContentItem}>
                    {message.quotedMsg && renderQuotedMessage(message)}
                    {message.mediaType === "contactMessage" && (
                      renderMessageContact(contact)
                    )}
                    {message.mediaType !== "contactMessage" && <MarkdownWrapper>{message.body}</MarkdownWrapper>}
                    <span className={classes.timestamp}>
                      {format(parseISO(message.createdAt), "HH:mm")}
                      {renderMessageAck(message)}
                    </span>
                  </div>
                  {message.mediaType === "contactMessage" && renderCardContact(contact)}
                </div>
              </div>
            </React.Fragment>
          );
        }
      });
      return viewMessagesList;
    } else {
      return <div>Say hello to your new contact!</div>;
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (e.target === e.currentTarget) {
      return;
    }
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleChangeMedias(files);
  };


  return (
    <div className={classes.messagesListWrapper}>
      <MessageOptionsMenu
        message={selectedMessage}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
      />
      <div
        id="messagesList"
        className={classes.messagesList}
        onScroll={handleScroll}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging ? (
          <span
            style={{
              backgroundColor: "#EEEEEE",
              display: "flex",
              alignContent: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              fontSize: 22,
            }}
          >
            Arraste um arquivo
          </span>
        ) : (
          <div className={classes.messagesListMessages}>
            {messagesList.length > 0 ? renderMessages() : []}
          </div>
        )
        }
      </div>
      {isloading && (
        <div>
          <CircularProgress className={classes.circleLoading} />
        </div>
      )}
    </div>
  );
};

export default MessagesList;
