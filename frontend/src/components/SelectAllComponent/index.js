import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Chip from "@material-ui/core/Chip";

const useStyles = makeStyles((theme) => ({
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: 2,
  },
}));

const SelectAllComponent = ({
  selectedModules,
  onChange,
  opcoes,
  placeholder,
}) => {
  const classes = useStyles();

  const selectedValues = selectedModules.filter(module => module !== null);

  const handleChange = (e) => {
    const selectedValues = e.target.value;
    onChange(selectedValues);
  };

  return (
    <div style={{ marginTop: 6 }}>
      <FormControl fullWidth margin="dense" variant="outlined">
        <InputLabel>{placeholder}</InputLabel>
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
          renderValue={(selected) => (
            <div className={classes.chips}>
              {selected?.length > 0 &&
                selected.map(id => {
                  const user = opcoes.find(opt => opt.id === id);
                  return user ? (
                    <Chip
                      key={id}
                      style={{ backgroundColor: "gray" }}
                      variant="outlined"
                      label={user.nome}
                      className={classes.chip}
                    />
                  ) : null;
                })}
            </div>
          )}
        >
          {opcoes.map((opcao) => (
            <MenuItem key={opcao.id} value={opcao.id}>
              {opcao.nome}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default SelectAllComponent;