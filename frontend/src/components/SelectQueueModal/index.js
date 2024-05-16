import React, { useState, useContext } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { i18n } from "../../translate/i18n";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { Grid, ListItemText, MenuItem, Select } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";

const SelectQueueModal = ({
    modalOpen,
    handleClose,
    onClick
}) => {
    const [selectedQueue, setSelectedQueue] = useState("");
    const { user } = useContext(AuthContext);

    return (
        <Dialog
            maxWidth="lg"
            open={modalOpen}
            onClose={() => handleClose()}>
            <DialogTitle>
                {i18n.t("titleQueueModal.title")}
            </DialogTitle>
            <DialogContent dividers>
                <Grid xs={12} item>
                    <Select
                        fullWidth
                        displayEmpty
                        variant="outlined"
                        value={selectedQueue}
                        onChange={(e) => {
                            setSelectedQueue(e.target.value)
                        }}
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
                        renderValue={() => {
                            if (selectedQueue === "") {
                                return "Selecione uma fila"
                            }
                            const queue = user.queues.find(q => q.id === selectedQueue)
                            return queue.name
                        }}
                    >
                        {user.queues?.length > 0 &&
                            user.queues.map((queue, key) => (
                                <MenuItem dense key={key} value={queue.id}>
                                    <ListItemText primary={queue.name} />
                                </MenuItem>
                            ))}
                    </Select>
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
                    onClick={() => {
                        onClick(selectedQueue);
                        handleClose();
                    }}
                    color="primary"
                >
                    {i18n.t("newTicketModal.buttons.ok")}
                </ButtonWithSpinner>
            </DialogActions>
        </Dialog>
    );
};

export default SelectQueueModal;