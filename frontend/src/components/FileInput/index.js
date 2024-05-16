import { IconButton, makeStyles } from "@material-ui/core";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import React from "react";

const useStyles = makeStyles((theme) => ({
uploadInput: {
  display: 'none',
},

attachIcons: {
  color: 'grey',
}
}));

export const FileInput = (props) => {
    const {handleChangeMedias, disableOption, rest} = props;
    const classes = useStyles();

    return (
      <>
        <input
          multiple
          type="file"
          id="upload-button"
          disabled={disableOption}
          className={classes.uploadInput}
          onChange={handleChangeMedias}
          {...rest}
        
        />
        <label htmlFor="upload-button">
          <IconButton
            aria-label="upload"
            component="span"
            disabled={disableOption}
          >
            <AttachFileIcon className={classes.attachIcons} />
          </IconButton>
        </label>
      </>
    );
  };
  