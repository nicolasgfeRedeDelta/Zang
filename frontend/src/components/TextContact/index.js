import React, { useState, useEffect, useReducer } from "react";

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
  Box,
  Divider,
  FormControl,
  Grid,
  TextField,
  makeStyles
} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
}));

const TextContacts = ({
  modalOpen,
  handleClose,
  handleSave,
  name,
  setName,
  value,
  setValue,
}) => {

  return (
    <Dialog
      open={modalOpen}
      onClose={() => handleClose()}
      PaperProps={{
        style: { height: '60vh', width: '35vw' }
      }}
    >
      <DialogTitle >
        Selecionar contatos por texto
      </DialogTitle>
      <Divider />
      <DialogContent >
        <Grid >
          <TextField
            label="Nome da lista de contato"
            variant="filled"
            fullWidth
            margin="normal"
            size="large"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            value={value}
            onChange={(e) => setValue(e.target.value)}
            fullWidth
            rows={7}
            label={"lista de contatos"}
            placeholder={"554635230686, Okton Soluções; 554635230686, Okton Soluções, contato@okton.com.br"}
            multiline
            variant="outlined"
            helperText="Adicione as informações em ordem ex: numero, nome, email; numero, nome, email. Obs: nome e email opcional"
            style={{ marginTop: 5 }} 
          />
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="secondary"
          variant="outlined"
        >
          {i18n.t("newTicketModal.buttons.cancel")}
        </Button>
        <ButtonWithSpinner
          variant="contained"
          type="button"
          onClick={() => handleSave()}
          onClose={() => handleClose()}
          color="primary"
        >
          {i18n.t("newTicketModal.buttons.ok")}
        </ButtonWithSpinner>
      </DialogActions>
    </Dialog>
  );
};

export default TextContacts;