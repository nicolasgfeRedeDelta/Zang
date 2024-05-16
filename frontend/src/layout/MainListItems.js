import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import VpnKeyIcon from "@material-ui/icons/VpnKey";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import { AddCircleOutline, ChatBubbleOutlineOutlined, LibraryBooks } from "@material-ui/icons";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List, Tooltip } from "@material-ui/core";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SyncAltIcon from "@material-ui/icons/SyncAlt";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import EventIcon from "@material-ui/icons/Event";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import SubdirectoryArrowRightIcon from '@material-ui/icons/SubdirectoryArrowRight';
import TuneIcon from '@material-ui/icons/Tune';

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { makeStyles } from "@material-ui/core/styles";
import { socketConnection } from "../services/socket";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { ChatbotsCountContext } from "../context/ChatbotCount/ChatbotsCountContext";

const useStyles = makeStyles(theme => ({
  icon: {
    color: theme.icons.primary.main
  },
  text: {
    color: theme.textColorMenu.primary.main,
    opacity: "0.8",
  },
  textDivider: {
    color: theme.textColorMenu.secondary.main,
    opacity: "1",
  }
}));

function ListItemLink(props) {
  const { icon, primary, to, className, drawerOpen, onClick } = props;
  const classes = useStyles();

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  return (
    <li>
      <ListItem button component={renderLink} className={className} onClick={onClick}>
        {/* {icon ? <ListItemIcon>{icon}</ListItemIcon> : null} */}
        {icon ?
          <ListItemIcon className={classes.icon}>
            {(drawerOpen == true) ? (<>{icon}</>) : (
              <Tooltip title={primary} placement="right-start">
                {icon}
              </Tooltip>
            )
            }
          </ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const { drawerClose, drawerOpen } = props;
  const classes = useStyles();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { count } = useContext(ChatbotsCountContext);
  const { user } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openConfigSubmenu, setOpenConfigSubmenu] = useState(false);
  const [openChatbotSubmenu, setOpenChatbotSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const history = useHistory();

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div>
      <Can
        role={user.profile}
        perform="dashboard:view"
        yes={() => (
          <ListItemLink
            to="/"
            primary="Dashboard"
            icon={<DashboardOutlinedIcon />}
            className={classes.text}
            drawerOpen={drawerOpen}
            onClick={drawerClose}
          />
        )}
      />
      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<WhatsAppIcon />}
        className={classes.text}
        drawerOpen={drawerOpen}
        onClick={drawerClose}
      />

      <ListItemLink
        to="/schedules"
        primary={i18n.t("mainDrawer.listItems.schedules")}
        icon={<EventIcon />}
        className={classes.text}
        drawerOpen={drawerOpen}
        onClick={drawerClose}
      />

      <ListItemLink
        to="/quick-messages"
        primary={i18n.t("mainDrawer.listItems.quickMessages")}
        icon={<FlashOnIcon />}
        className={classes.text}
        drawerOpen={drawerOpen}
        onClick={drawerClose}
      />

      {(user.viewChatbot || user.editQueue) && (
        <>
          <ListItem
            button
            onClick={() => setOpenChatbotSubmenu((prev) => !prev)}
          >
            <ListItemIcon>
              {(drawerOpen == false) ? (
                <>
                  {(count === 0) ? (
                    <Tooltip
                      placement="right-start"
                      title={i18n.t("mainDrawer.listItems.queueAndChabot")}
                    >
                      <AccountTreeOutlinedIcon />
                    </Tooltip>
                  ) : (
                    <Tooltip
                      placement="right-start"
                    >
                      <Badge badgeContent={count} color="primary">
                        <Tooltip
                          placement="right-start"
                          title={i18n.t("mainDrawer.listItems.queueAndChabot")}
                        >
                          <AccountTreeOutlinedIcon />
                        </Tooltip>
                      </Badge>
                    </Tooltip>
                  )}
                </>
              ) : (
                <>
                  {(count === 0) ? (
                    <AccountTreeOutlinedIcon />
                  ) : (
                    <Badge badgeContent={count} color="primary">
                      <AccountTreeOutlinedIcon />
                    </Badge>
                  )}
                </>
              )}
            </ListItemIcon>
            <ListItemText
              primary={i18n.t("mainDrawer.listItems.queueAndChabot")}
            />
            {openChatbotSubmenu ? (
              <ExpandLessIcon />
            ) : (
              <ExpandMoreIcon />
            )}
          </ListItem>
        </>
      )}

      <Collapse
        style={{ paddingLeft: 15 }}
        in={openChatbotSubmenu}
        timeout="auto"
        unmountOnExit
      >
        <List component="div" disablePadding>
          {user.viewChatbot && (
            <ListItemLink
              to="/chatbots"
              primary={i18n.t("mainDrawer.listItems.chatbots")}
              icon={count === 0 ?
                <WhatsAppIcon />
                :
                <Badge badgeContent={count} color="primary">
                  <WhatsAppIcon />
                </Badge>
              }
              className={classes.text}
              onClick={drawerClose}
            />
          )}
          {user.editQueue && (
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<SubdirectoryArrowRightIcon />}
              className={classes.text}
              onClick={drawerClose}
            />
          )}
        </List>
      </Collapse>

      {showCampaigns && (
        <>
          <ListItem
            button
            onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
          >
            <ListItemIcon>
              {(drawerOpen == false) ? (
                <Tooltip
                  placement="right-start"
                  title={i18n.t("mainDrawer.listItems.campaigns")}
                >
                  <EventAvailableIcon />
                </Tooltip>
              ) : (
                <EventAvailableIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary={i18n.t("mainDrawer.listItems.campaigns")}
              drawerOpen={drawerOpen}
            />
            {openCampaignSubmenu ? (
              <ExpandLessIcon />
            ) : (
              <ExpandMoreIcon />
            )}
          </ListItem>
          <Collapse
            style={{ paddingLeft: 15 }}
            in={openCampaignSubmenu}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              <ListItemLink
                to="/campaigns"
                primary="Listagem"
                icon={<ListIcon />}
                drawerOpen={drawerOpen}
                onClick={drawerClose}
              />
              <ListItemLink
                to="/contact-lists"
                primary="Listas de Contatos"
                icon={<PeopleIcon />}
                drawerOpen={drawerOpen}
                onClick={drawerClose}
              />
              <ListItemLink
                to="/campaigns-config"
                primary="Configurações"
                icon={<SettingsOutlinedIcon />}
                drawerOpen={drawerOpen}
                onClick={drawerClose}
              />
            </List>
          </Collapse>
        </>
      )}

      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            <Divider />
            <ListSubheader inset>
              {i18n.t("mainDrawer.listItems.administration")}
            </ListSubheader>
            {user.profile === "admin" && (
              <>
                <ListItemLink
                  to="/contacts"
                  primary={i18n.t("mainDrawer.listItems.contacts")}
                  icon={<ContactPhoneOutlinedIcon />}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  onClick={drawerClose}
                />

                <ListItemLink
                  to="/chats"
                  primary={i18n.t("mainDrawer.listItems.chats")}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  icon={
                    <Badge color="secondary" variant="dot" invisible={invisible}>
                      <ForumIcon />
                    </Badge>
                  }
                  onClick={drawerClose}
                />

                <ListItemLink
                  to="/tags"
                  primary={i18n.t("mainDrawer.listItems.tags")}
                  icon={<LocalOfferIcon />}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  onClick={drawerClose}
                />

                <ListItem
                  button
                  onClick={() => setOpenConfigSubmenu((prev) => !prev)}
                >
                  <ListItemIcon>
                    {(drawerOpen == false) ? (
                      <>
                        {(connectionWarning === true) ? (
                          <>
                            <Tooltip
                              placement="right-start"
                              title={i18n.t("mainDrawer.listItems.settings")}
                            >
                              <Tooltip
                                placement="right-start"
                                title={"Verificar conexão!"}
                              >
                                <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                                  <TuneIcon />
                                </Badge>
                              </Tooltip>
                            </Tooltip>
                          </>
                        ) : <TuneIcon />}
                      </>
                    ) : (
                      <>
                        {(connectionWarning === true) ? (
                          <Tooltip
                            placement="right-start"
                            title={"Verificar conexão!"}
                          >
                            <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                              <TuneIcon />
                            </Badge>
                          </Tooltip>
                        ) : <TuneIcon />}
                      </>
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={i18n.t("mainDrawer.listItems.settings")}
                  />
                  {openConfigSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openConfigSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    <ListItemLink
                      to="/settings"
                      primary={i18n.t("mainDrawer.listItems.settings")}
                      icon={<SettingsOutlinedIcon />}
                      className={classes.text}
                      drawerOpen={drawerOpen}
                      onClick={drawerClose}
                    />

                    <ListItemLink
                      to="/connections"
                      primary={i18n.t("mainDrawer.listItems.connections")}
                      className={classes.text}
                      drawerOpen={drawerOpen}
                      icon={
                        <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                          <SyncAltIcon />
                        </Badge>
                      }
                      onClick={drawerClose}
                    />

                    <ListItemLink
                      to="/users"
                      primary={i18n.t("mainDrawer.listItems.users")}
                      icon={<PeopleAltOutlinedIcon />}
                      className={classes.text}
                      drawerOpen={drawerOpen}
                      onClick={drawerClose}
                    />

                    <ListItemLink
                      to="/messages-api"
                      primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                      icon={<CodeRoundedIcon />}
                      className={classes.text}
                      drawerOpen={drawerOpen}
                      onClick={drawerClose}
                    />
                  </List>
                </Collapse>

                <ListItemLink
                  to="/helps"
                  primary={i18n.t("mainDrawer.listItems.helps")}
                  icon={<HelpOutlineIcon />}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  onClick={drawerClose}
                />

                {user.super && (
                  <ListItemLink
                    to="/announcements"
                    primary={i18n.t("mainDrawer.listItems.annoucements")}
                    icon={<AnnouncementIcon />}
                    className={classes.text}
                    drawerOpen={drawerOpen}
                  />
                )}
              </>
            )}


            {user.profile === "user" && (
              <>
                <ListItemLink
                  to="/contacts"
                  primary={i18n.t("mainDrawer.listItems.contacts")}
                  icon={<ContactPhoneOutlinedIcon />}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  onClick={drawerClose}
                />

                <ListItemLink
                  to="/chats"
                  primary={i18n.t("mainDrawer.listItems.chats")}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  icon={
                    <Badge color="secondary" variant="dot" invisible={invisible}>
                      <ForumIcon />
                    </Badge>
                  }
                  onClick={drawerClose}
                />

                <ListItemLink
                  to="/tags"
                  primary={i18n.t("mainDrawer.listItems.tags")}
                  icon={<LocalOfferIcon />}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  onClick={drawerClose}
                />

                <ListItem
                  button
                  onClick={() => setOpenConfigSubmenu((prev) => !prev)}
                >
                  <ListItemIcon>
                    {(drawerOpen == false) ? (
                      <Tooltip
                        placement="right-start"
                        title={i18n.t("mainDrawer.listItems.settings")}
                      >
                        <EventAvailableIcon />
                      </Tooltip>
                    ) : (
                      <EventAvailableIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={i18n.t("mainDrawer.listItems.settings")}
                  />
                  {openConfigSubmenu ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </ListItem>
                <Collapse
                  style={{ paddingLeft: 15 }}
                  in={openConfigSubmenu}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    <ListItemLink
                      to="/connections"
                      primary={i18n.t("mainDrawer.listItems.connections")}
                      className={classes.text}
                      drawerOpen={drawerOpen}
                      icon={
                        <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                          <SyncAltIcon />
                        </Badge>
                      }
                      onClick={drawerClose}
                    />
                  </List>
                </Collapse>

                <ListItemLink
                  to="/helps"
                  primary={i18n.t("mainDrawer.listItems.helps")}
                  icon={<HelpOutlineIcon />}
                  className={classes.text}
                  drawerOpen={drawerOpen}
                  onClick={drawerClose}
                />
              </>
            )}
          </>
        )}
      />
    </div>
  );
};

export default MainListItems;
