import React, { useState, useEffect, useReducer, useRef } from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

import { i18n } from "../../translate/i18n";
import ButtonWithSpinner from "../ButtonWithSpinner";
import api from "../../services/api";
import FilterListIcon from "@material-ui/icons/FilterList";
import {
  Card,
  CardHeader,
  Checkbox,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  debounce,
  makeStyles
} from "@material-ui/core";
import { useContactCompaign } from "../../services/hooks/useContactCampaign";

const useStyles = makeStyles(theme => ({
  containerFilter: {
    display: "flex",
    justifyContent: "space-evenly",
    flexDirection: "row"
  },
  filterRow: {
    display: "flex", flexDirection: "row"
  },
  filterColumn: {
    display: "flex", flexDirection: "column"
  },
  periodFilter: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  inputIsActive: {
    width: 290,
    marginTop: 16
  },
  listContacts: {
    display: 'flex',
    alignItems: 'center',
  },
  listContactsItem: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  ticketsList: {
    flex: 1,
    maxHeight: "100%",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    borderTop: "2px solid rgba(0, 0, 0, 0.12)",
  },
}));

const reducer = (state, action) => {

  if (action.type === "NEXT_PAGE_CONTACT") {
    if (action.pages > 1 && action.fetchNewPage) {
      return [...state, ...action.payload];
    } else if (action.pages > 1) {
      const finalPageContacts = action.pages * 30;
      const firstBlock = state.slice(0, finalPageContacts - 30);
      const secondBlock = state.slice(finalPageContacts, state.length);
      return [...firstBlock, ...action.payload, ...secondBlock];
    } else {
      return [...action.payload];
    }
  }

  if (action.type === "LOAD_CONTACTS") {
    return [...action.payload]
  }
}

const SelectContacts = ({
  modalOpen,
  handleClose,
  handleSave,
  handleChecked,
  contacts,
  name,
  setName,
  user,
}) => {
  const classes = useStyles();
  const [nameFilter, setNameFilter] = useState(null);
  const [status, setStatus] = useState(null);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoadign] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [fetchNewPage, setFetchNewPage] = useState(false);
  const [filteredList, dispatch] = useReducer(reducer, []);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [contactsListIds, setConstactsListIds] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [date, setDate] = useState({ initial: "", final: "" });

  const { data, fetchNextPage, refetch } = useContactCompaign({
    pageNumber,
    nameFilter,
    selectedQueueIds,
    date,
    status
  });

  useEffect(() => {
    if (!data) return;
    setHasMore(data.pages[data.pages.length - 1].hasMore)
    dispatch({ type: 'NEXT_PAGE_CONTACT', payload: data.pages[data.pages.length - 1].contacts, pages: data.pages.length, fetchNewPage });
    setIsLoadign(false);
  }, [data]);

  useEffect(() => {
    const busca = async () => {
      const { data: dataIDs } = await api.get(`/contactsCampaign/listIds`, {
        params: {
          pageNumber,
          nameFilter,
          selectedQueueIds,
          date,
          status,
        }
      });
      setConstactsListIds(dataIDs);
      return dataIDs;
    }
    if (showAll) {
      busca();
    }
  }, [showAll]);

  useEffect(() => {
    if (pageNumber > 1) {
      fetchNextPage();
    }
    if (pageNumber === 1) {
      refetch();
    }
  }, [pageNumber]);

  useEffect(() => {
    filteredList.map((value) => {
      let checked = showAll;
      if (!showAll) {
        const result = contactsListIds.findIndex((v) => v.id === value.id)
        checked = !(result === -1);
      }
      const event = { target: { checked: checked } };
      handleChecked(event, value);
    })
  }, [filteredList]);

  useEffect(() => {
    filteredList.map((value) => {
      let checkedAt = showAll;
      if (!showAll) {
        const result = contactsListIds.findIndex((v) => v.id === value.id)
        checkedAt = !(result === -1);
      }
      const event = { target: { checked: checkedAt } };
      handleChecked(event, value);
    })
  }, [contactsListIds]);

  useEffect(() => {
    setShowAll(false);
    if (pageNumber > 1) {
      dispatch({ type: 'LOAD_CONTACTS', payload: [] });
      setPageNumber(1);
      return;
    }
    refetch();
  }, [nameFilter, status, selectedQueueIds, date])

  const handleScroll = ((e) => {
    if (!hasMore || isLoading || filteredList.length == 0) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const tolerance = 10;

    if (scrollTop >= scrollHeight - clientHeight - tolerance && hasMore) {

      loadMore();
    }
  });

  const loadMore = debounce(() => {
    if (hasMore) {
      setPageNumber(pageNumber + 1);
      setFetchNewPage(true)
    }
  }, 300);

  return (
    <Dialog
      maxWidth="80"
      open={modalOpen}
      onClose={() => handleClose()}
      PaperProps={{
        style: { height: '80vh' }
      }}
    >
      <DialogTitle style={{ width: 700 }}>
        Selecionar Contatos
      </DialogTitle>
      <Grid container alignItems="center" justifyContent="center">
        <Grid item xs={10}>
          <FormControl fullWidth sx={{ m: 1 }} variant="standard">
            <TextField
              label="Nome da lista de contato"
              variant="filled"
              margin="normal"
              size="large"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
        </Grid>
        <Grid item xs={1}>
          <IconButton color="primary" onClick={() => setOpenFilterModal(!openFilterModal)}>
            <FilterListIcon />
          </IconButton>
        </Grid>
      </Grid>
      {(openFilterModal === true) && (
        <>
          <Grid className={classes.containerFilter}>
            <Grid className={classes.filterColumn}>
              <FormControl sx={{ m: 1 }} >
                <TextField
                  displayEmpty
                  label="Nome do contato"
                  style={{ width: 290 }}
                  value={nameFilter}
                  onChange={(e) => {
                    setNameFilter(e.target.value)
                  }}
                  variant="standard"
                />
              </FormControl>
              <Grid item xs={12} className={classes.periodFilter}>
                <TextField
                  label="Período (inicial)"
                  type="date"
                  value={date.initial}
                  onChange={(e) => setDate({ initial: e.target.value, final: date.final })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  md={2}
                  sm={3}
                />
                <TextField
                  label="Período (final)"
                  type="date"
                  value={date.final}
                  onChange={(e) => setDate({ initial: date.initial, final: e.target.value })}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sm={3}
                  md={2}
                />
              </Grid>
            </Grid>
            <Grid className={classes.filterColumn}>
              <Select
                multiple
                displayEmpty
                variant={"standard"}
                style={{ width: 290, marginTop: 16 }}
                value={selectedQueueIds}
                onChange={(e) => setSelectedQueueIds(e.target.value)}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                renderValue={() => i18n.t("ticketsQueueSelect.placeholder")}
              >
                {user?.queues?.length > 0 &&
                  user?.queues.map(queue => (
                    <MenuItem dense key={queue.id} value={queue.id}>
                      <Checkbox
                        style={{
                          color: queue.color,
                        }}
                        size="small"
                        color="primary"
                        checked={selectedQueueIds.indexOf(queue.id) > -1}
                      />
                      <ListItemText primary={queue.name} />
                    </MenuItem>
                  ))}
              </Select>
              <FormControl fullWidth>
                <InputLabel>Conversa ativa</InputLabel>
                <Select
                  displayEmpty
                  variant="standard"
                  className={classes.inputIsActive}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  renderValue={() => {
                    if (status === true) {
                      return "Ticket ativo "
                    } else if (status === false) {
                      return "Ticket fechado"
                    }
                  }}
                >
                  <MenuItem value={null}>
                    <em>Nenhum</em>
                  </MenuItem>
                  <MenuItem value={false}>
                    <ListItemText primary={"Ticket fechado"} />
                  </MenuItem>
                  <MenuItem value={true}>
                    <ListItemText primary={"Ticket ativo"} />
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </>
      )}

      <Divider />
      <DialogContent dividers>
        <Paper
          square
          name="closed"
          elevation={0}
          className={classes.ticketsList}
          onScroll={handleScroll}
        >
          <Card>
            <div className={classes.filterRow}>
              <Checkbox
                onChange={() => {
                  if (showAll) {
                    setShowAll(false)
                    setConstactsListIds([]);
                    return;
                  }
                  setShowAll((prevState) => !prevState)
                }}

                checked={showAll}
                tabIndex={-1}
                disableRipple
              />
              <CardHeader
                sx={{ px: 2, py: 1 }}
                subheader={"Nome"}
                style={{ flex: 1, paddingLeft: 16 }}
              />
              <CardHeader
                sx={{ px: 2, py: 1 }}
                subheader={"Número"}
                style={{ flex: 1 }}
              />
              <CardHeader
                sx={{ px: 2, py: 1 }}
                subheader={"Data último Contato"}
                style={{ flex: 1 }}
              />
            </div>
            <Divider />

            {filteredList.map((value) => (
              <>
                <ListItem
                  key={value.id}
                  className={classes.listContacts}
                >
                  <ListItemIcon>
                    <Checkbox
                      onChange={(event) => {
                        if (showAll) {
                          setShowAll(false)
                        };
                        if (event.target.checked) {
                          setConstactsListIds((prevState) => [...prevState, { id: value.id }])
                        } else {
                          setConstactsListIds((prevSelected) => prevSelected.filter((selected) => selected.id !== value.id));
                        }
                      }}
                      checked={contacts.includes(value)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <Typography
                    component="div"
                    className={classes.listContactsItem}
                  >
                    {value.name}
                  </Typography>
                  <Typography
                    className={classes.listContactsItem}
                    component="div"
                  >
                    +{value.number.slice(0, 2)} ({value.number.slice(2, 4)}) {value.number.slice(4, 8)}-{value.number.slice(8, 14)}
                  </Typography>
                  <Typography
                    component="div"
                    className={classes.listContactsItem}
                  >
                    {new Date(value.ticketat).toLocaleString('pt-BR')}
                  </Typography>
                </ListItem>
                <Divider />
              </>
            ))}
          </Card>
        </Paper>
      </DialogContent>
      <DialogActions>
        <p>
          {`${contactsListIds.length} selecionados.`}
        </p>
        <Button
          onClick={() => {
            setOpenFilterModal(false);
            setHasMore(false);
            setNameFilter(null);
            setStatus(null);
            setIsLoadign(false);
            setShowAll(false);
            setFetchNewPage(false);
            setSelectedQueueIds([]);
            setConstactsListIds([]);
            setPageNumber(1);
            handleClose();
          }}
          color="secondary"
          variant="outlined"
        >
          {i18n.t("newTicketModal.buttons.cancel")}
        </Button>
        <ButtonWithSpinner
          variant="contained"
          type="button"
          onClick={() => {
            handleSave(contactsListIds, () => {
              setNameFilter(null);
              setStatus(null);
              setOpenFilterModal(false);
              setHasMore(false);
              setIsLoadign(false);
              setShowAll(false);
              setFetchNewPage(false);
              setSelectedQueueIds([]);
              setConstactsListIds([]);
              setPageNumber(1);
            });
          }}
          onClose={() => {
            setHasMore(false);
            setIsLoadign(false);
            setShowAll(false);
            setFetchNewPage(false);
            setSelectedQueueIds([]);
            setConstactsListIds([]);
            setPageNumber(1);
            handleClose();
          }}
          color="primary"
        >
          {i18n.t("newTicketModal.buttons.ok")}
        </ButtonWithSpinner>
      </DialogActions>
    </Dialog >
  );
};

export default SelectContacts;