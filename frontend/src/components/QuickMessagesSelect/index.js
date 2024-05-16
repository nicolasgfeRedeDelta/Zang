import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Chip from "@material-ui/core/Chip";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
    chips: {
        display: "flex",
        flexWrap: "wrap",
    },
    chip: {
        margin: 2,
    },
}));

const QuickMessagesSelect = ({ selectedModules, onChange }) => {
    const classes = useStyles();
    const opcoes = [
        { id: 1, nome: "Agendamentos" },
        { id: 2, nome: "Atendimentos" },
        { id: 3, nome: "Campanhas" }
    ];

    const selectedValues = selectedModules.filter(module => module !== null);

    const handleChange = e => {
        const selectedValues = e.target.value;
        onChange(selectedValues);onChange(selectedValues);
    };

    return (
        <div style={{ marginTop: 6 }}>
            <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel>{i18n.t("quickMessages.modulosSelect")}</InputLabel>
                <Select
                    multiple
                    labelWidth={60}
                    value={selectedValues}
                    onChange={handleChange}
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
                    renderValue={selected => (
                        <div className={classes.chips}>
                            {selected?.length > 0 &&
                                selected.map((id, i) => {
                                    return selected ? (
                                        <Chip
                                            key={id}
                                            style={{ backgroundColor: "gray" }}
                                            variant="outlined"
                                            label={selected[i]}
                                            className={classes.chip}
                                        />
                                    ) : null;
                                })}
                        </div>
                    )}
                >
                    {opcoes.map((opcao) => (
                        <MenuItem key={opcao.id} value={opcao.nome}>
                            {opcao.nome}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
};

export default QuickMessagesSelect;
