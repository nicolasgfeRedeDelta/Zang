import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green, grey } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import Badge from "@material-ui/core/Badge";
import Box from "@material-ui/core/Box";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { AuthContext } from "../../context/Auth/AuthContext";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext"
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import AndroidIcon from "@material-ui/icons/Android";
import VisibilityIcon from "@material-ui/icons/Visibility";
import TicketMessagesDialog from "../TicketMessagesDialog";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Select, Tooltip } from "@material-ui/core";
import { ChatModal } from "../../pages/Chat";
import SelectQueueModal from "../SelectQueueModal";
import { PageNumberContext } from "../../context/Pagenumber/PagenumberContext";
import { ChatbotsCountContext } from "../../context/ChatbotCount/ChatbotsCountContext";

const useStyles = makeStyles((theme) => ({
  ticket: {
    position: "relative",
  },

  pendingTicket: {
    cursor: "unset",
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  contactNameWrapper: {
    display: "flex",
    justifyContent: "space-between",
  },

  lastMessageTime: {
    justifySelf: "flex-end",
    textAlign: "right",
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 32,
    marginLeft: "auto",
  },

  contactLastMessage: {
    paddingRight: 60,
  },

  newMessagesCount: {
    alignSelf: "center",
    marginRight: 8,
    marginLeft: "auto",
  },

  badgeStyle: {
    color: "white",
    backgroundColor: green[500],
    right: 40,
  },

  acceptButton: {
    position: "absolute",
    right: "108px",
  },

  ticketQueueColor: {
    flex: "none",
    width: "8px",
    height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
  },

  ticketInfo: {
    textAlign: "right",
  },
}));

const TicketListItemCustom = ({ ticket }) => {
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [ticketUser, setTicketUser] = useState(null);
  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const [ticketConection, setTicketConection] = useState("");
  const [modalQueueOpen, setModalQueueOpen] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);
  const { whatsApps } = useContext(WhatsAppsContext);
  const { handleCount } = useContext(ChatbotsCountContext);
  const { profile } = user;
  const [connectionColor, setConnectionColor] = useState();
  const { setPageNumber } = useContext(PageNumberContext);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ticket.userId && ticket.user) {
      setTicketUser(ticket.user.name);
    }
    if (ticket.whatsappId && whatsApps.length > 0) {
      const whats = whatsApps.find(whats => whats.id === ticket.whatsappId);
      setTicketConection(whats.name);
      setConnectionColor(whats.color)
    }

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate } = useMutation(
    async (id) => {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
      })
    }, {
    onSuccess: () => {
      queryClient.invalidateQueries(["tickets", "open"]);
      queryClient.invalidateQueries(["tickets", "pending"]);
      queryClient.invalidateQueries(["tickets", "chatbot"]);
    }
  }
  );

  const handleSetQueueTiket = async (tiketId, queueId) => {
    let selectedQueue;
    if (user.queues.length === 1) {
      selectedQueue = user.queues[0].id;
    } else {
      selectedQueue = queueId;
    }
    setLoading(true);
    try {
      await api.put(`/tickets/${tiketId}`, {
        status: "open",
        accepModal: true,
        userId: user?.id,
        whatsappId: ticket.whatsappId,
        contactId: ticket.contactId,
        queueId: selectedQueue
      });
      queryClient.invalidateQueries(["tickets", "open"]);
      queryClient.invalidateQueries(["tickets", "pending"]);
      queryClient.invalidateQueries(["tickets", "chatbot"]);
      handleCount();
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
    if (isMounted.current) {
      setLoading(false);
    }
    history.push(`/tickets/${ticket.uuid}`);
  };

  const handleSelectTicket = (ticket) => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };

  const handleCloseQueueModal = () => {
    setModalQueueOpen(false);
  }

  const queueDecisionStructure = (ticket, user) => {
    if (ticket.queueId) {
      handleSetQueueTiket(ticket.id);
    } else if (user.queues.length > 1) {
      setModalQueueOpen(true);
    } else {
      handleSetQueueTiket(ticket.id);
    }
  }

  const renderTicketInfo = () => {
    if (ticketUser) {
      return (
        <>
          {profile === "admin" && (
            <Tooltip title="Espiar Conversa">
              <VisibilityIcon
                onClick={() => setOpenTicketMessageDialog(true)}
                fontSize="small"
                style={{
                  color: grey[700],
                  cursor: "pointer",
                  marginRight: 5,
                }}
              />
            </Tooltip>
          )}
          {ticket.isBot && (
            <Tooltip title="Chatbot">
              <AndroidIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}
          <Tooltip title={`Atribuido à ${ticketUser}`}>
            <WhatsAppIcon fontSize="small" style={{ color: grey[700], marginRight: 5 }} />
          </Tooltip>
          {ticket.isBot && (
            <Tooltip title="connections">
              <AndroidIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}
          <Tooltip title={`Conexão: ${ticketConection}`}>
            <SyncAltIcon fontSize="small" style={{ color: connectionColor }} />
          </Tooltip>
        </>
      );
    } else {
      return (
        <>
          {ticket.isBot && (
            <Tooltip title="Chatbot">
              <AndroidIcon
                fontSize="small"
                style={{ color: grey[700], marginRight: 5 }}
              />
            </Tooltip>
          )}
          {profile === "admin" && (
            <Tooltip title="Espiar Conversa">
              <VisibilityIcon
                onClick={() => setOpenTicketMessageDialog(true)}
                fontSize="small"
                style={{
                  color: grey[700],
                  cursor: "pointer",
                  marginRight: 5,
                }}
              />
            </Tooltip>
          )}
          <Tooltip title={`Conexão: ${ticketConection}`}>
            <SyncAltIcon fontSize="small" style={{ color: connectionColor }} />
          </Tooltip>
        </>
      );
    }
  };

  return (
    <React.Fragment key={ticket.id}>
      <TicketMessagesDialog
        open={openTicketMessageDialog}
        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      ></TicketMessagesDialog>
      <ListItem
        dense
        button
        onClick={(e) => {
          if (ticket.status === "pending" || ticket.status === "chatbot") return;
          setPageNumber(1);
          handleSelectTicket(ticket);
        }}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
        })}
      >
        <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name || "Sem fila"}
        >
          <span
            style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }}
            className={classes.ticketQueueColor}
          ></span>
        </Tooltip>
        <ListItemAvatar>
          <Avatar src={ticket?.contact?.profilePicUrl} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>
              <Typography
                noWrap
                component="span"
                variant="body2"
                color="textPrimary"
              >
                {ticket.contact.name + " - Ticket #" + ticket.id}
              </Typography>
            </span>
          }
          secondary={
            <span className={classes.contactNameWrapper}>
              <Typography
                className={classes.contactLastMessage}
                noWrap
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {ticket.lastMessage ? (
                  <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
                ) : (
                  <br />
                )}
              </Typography>

              <Badge
                className={classes.newMessagesCount}
                badgeContent={ticket.unreadMessages}
                classes={{
                  badge: classes.badgeStyle,
                }}
              />
            </span>
          }
        />
        {((ticket.status === "pending" && !ticket.isGroup) || ticket.status === "chatbot") && (
          <ButtonWithSpinner
            color="primary"
            variant="contained"
            className={classes.acceptButton}
            size="small"
            loading={loading}
            onClick={() => queueDecisionStructure(ticket, user)}
          >
            {i18n.t("ticketsList.buttons.accept")}
          </ButtonWithSpinner>
        )}
        <ListItemSecondaryAction>
          {ticket.status === "closed" && (
            <Badge
              className={classes.closedBadge}
              badgeContent={"fechado"}
              color="primary"
            />
          )}
          {ticket.lastMessage && (
            <>
              <Typography
                className={classes.lastMessageTime}
                component="span"
                variant="body2"
                color="textSecondary"
              >
                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                  <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                ) : (
                  <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                )}
              </Typography>
              <br />
              <Box className={classes.ticketInfo}>{renderTicketInfo()}</Box>
            </>
          )}
        </ListItemSecondaryAction>
      </ListItem>
      <SelectQueueModal
        modalOpen={modalQueueOpen}
        handleClose={() => handleCloseQueueModal()}
        onClick={(queueId) => handleSetQueueTiket(ticket.id, queueId)}
      >
      </SelectQueueModal>
      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};

export default TicketListItemCustom;
