import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import HowToRegIcon from '@material-ui/icons/HowToReg';

import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { AuthContext } from "../../context/Auth/AuthContext";
import { ChatbotsCountContext } from "../../context/ChatbotCount/ChatbotsCountContext";

const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    width: "85vh"
  },

  tabsHeader: {
    backgroundColor: "#eee",
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 1,
  },

  tab: {
    minWidth: 150,
    width: 90,
  },

  ticketOptionsBox: {
    backgroundColor: "black",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fafafa",
    padding: theme.spacing(1),
  },

  serachInputWrapper: {
    flex: 1,
    background: "#fff",
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1),
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
  },

  badge: {
    right: "-10px",
  },
  show: {
    display: "block",
  },
  hide: {
    display: "none !important",
  },
}));

const ChatbotsManagerTabs = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { setCount } = useContext(ChatbotsCountContext);
  const [chatbotCount, setChatbotCount] = useState(0);
  const userQueueIds = user.queues.map((q) => q.id);
  const [selectedQueueIds] = useState(userQueueIds || []);
  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <TabPanel
        value="chatbot"
        name="chatbot"
        className={classes.ticketsWrapper}>
        <Tabs
          value="chatbot"
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={
              <Badge
                badgeContent={chatbotCount}
                color="primary"
              >
                <HowToRegIcon />
              </Badge>
            }
            label={"chatbots"}
            classes={{ root: classes.tab }}
            value={"chatbot"}
          />
        </Tabs>
        <Paper className={classes.ticketsWrapper}>
          <TicketsList
            status="chatbot"
            tab="chatbot"
            showAll={true}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setChatbotCount(val)}
          />
        </Paper>
      </TabPanel>
    </Paper>
  );
};

export default ChatbotsManagerTabs;