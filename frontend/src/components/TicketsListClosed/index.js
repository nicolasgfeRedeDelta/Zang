import React, { useState, useEffect, useReducer, useContext, useImperativeHandle } from "react";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketListItemClosed from "../TicketListItemClosed";
import { Typography, debounce } from "@material-ui/core";
import TicketsListSkeleton from "../TicketsListSkeleton";

const useStyles = makeStyles((theme) => ({
  contactDetails: {
    marginTop: 8,
    marginBottom: 70,
    padding: 8,
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  ticketsListWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  ticketsList: {
    flex: 1,
    maxHeight: "100%",
    borderTop: "2px solid rgba(0, 0, 0, 0.12)",
  },

  ticketsListHeader: {
    color: "rgb(67, 83, 105)",
    zIndex: 2,
    backgroundColor: "white",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ticketsCount: {
    fontWeight: "normal",
    color: "rgb(104, 121, 146)",
    marginLeft: "8px",
    fontSize: "14px",
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

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
}));


const TicketsListClosed = (props) => {
  const {
    style,
    contactId,
    onCloseDrawer,
  } = props;
  const classes = useStyles();
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const listTickets = async () => {
      setIsLoading(true)
      const { data } = await api.get("/tickets-closed", {
        params: {
          pageNumber,
          contactId
        }
      });
      setHasMore(data.hasMore)
      setIsLoading(false)
      setTickets(prevState => [...prevState, ...data.tickets]);
    }

    listTickets();
  }, [pageNumber])

  const loadMore = debounce(() => {
    setPageNumber(pageNumber + 1);
  }, 300);

  const handleScroll = ((e) => {
    if (!hasMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const tolerance = 10;

    if (scrollTop >= scrollHeight - clientHeight - tolerance && hasMore) {
      loadMore();
    }
  });

  return (
    <Paper
      square
      variant="outlined"
      className={classes.contactDetails}
      onScroll={handleScroll}>
      <Typography variant="subtitle1">
        {i18n.t("contactDrawer.listTicket")}
      </Typography>
      <Paper className={classes.ticketsListWrapper} style={style}>
        <Paper
          square
          name="closed"
          elevation={0}
          className={classes.ticketsList}
        >
          <List style={{ paddingTop: 0 }}>
            {tickets.length === 0 ? (
              <div className={classes.noTicketsDiv}>
                <span className={classes.noTicketsTitle}>
                  {i18n.t("ticketsList.noTicketsTitle")}
                </span>
                <p className={classes.noTicketsText}>
                  {i18n.t("ticketsList.noTicketsMessage")}
                </p>
              </div>
            ) : (
              <>
                {tickets.map((ticket, i) => (
                  <TicketListItemClosed ticket={ticket} key={ticket.id} onCloseDrawer={() => onCloseDrawer()} />
                ))}
              </>
            )}
            {isLoading && <TicketsListSkeleton />}
          </List>
        </Paper>
      </Paper>
    </Paper>
  );
};

export default TicketsListClosed;
