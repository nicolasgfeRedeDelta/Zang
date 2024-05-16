import React from "react";
import Dialog from "@material-ui/core/Dialog";
import { Paper, makeStyles } from "@material-ui/core";

import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
import {createFilterOptions} from "@material-ui/lab/Autocomplete";
import { ContactNotes } from "../ContactNotes";


const useStyles = makeStyles((theme) => ({
  maxWidth: {
    width: "100%",
  },
  contactDetails: {
		marginTop: 8,
		padding: 8,
		display: "flex",
		flexDirection: "column",
	},
}));

const filterOptions = createFilterOptions({
  trim: true,
});

const NotesTicket = ({ modalOpen, onClose, ticket }) => {
  const classes = useStyles();

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="lg" scroll="paper">
      <DialogTitle id="form-dialog-title">
          Observações do Contato
      </DialogTitle>
      <div>
      <Paper square variant="outlined" className={classes.contactDetails}>
        <ContactNotes 
          contactId={ticket.contactId} 
          onClose={() => onClose()}
        />
      </Paper>
      </div>
      <DialogActions>
      </DialogActions>
    </Dialog>
  );
};

export default NotesTicket;
