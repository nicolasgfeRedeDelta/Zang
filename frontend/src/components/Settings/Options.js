import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
// import Title from "../Title";

import useSettings from "../../hooks/useSettings";

import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import api from "../../services/api";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
}));

export default function Options(props) {
  const { settings, scheduleTypeChanged } = props;
  const classes = useStyles();
  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [chatbotType, setChatbotType] = useState("text");
  const [transferMessageQueue, setTransferMessageQueueQueue] = useState("false");
  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);

  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value);
      };
      const scheduleType = settings.find((s) => s.key === "scheduleType");
      if (scheduleType) {
        setScheduleType(scheduleType.value);
      };
      const chatbotType = settings.find((d) => d.key === "chatBotType");
      if (chatbotType) {
        setChatbotType(chatbotType.value);
      };
      const transferMessageQueue = settings.find((d) => d.key === "transferMessageQueue");
      if (transferMessageQueue) {
        setTransferMessageQueueQueue(transferMessageQueue.value);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value,
    });
    setLoadingUserRating(false);
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      key: "scheduleType",
      value,
    });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  const handleChangeSetting = async (e, value, change) => {
    const selectedValue = e.target.value;
    change(selectedValue);
    try {
      await api.put(`/settings/${value}`, {
        value: selectedValue,
      });
      toast.success(i18n.t("settings.success"));
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      <Grid spacing={3} container>
        {/* <Grid xs={12} item>
          <Title>Configurações Gerais</Title>
        </Grid> */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="ratings-label">Avaliações</InputLabel>
            <Select
              labelId="ratings-label"
              value={userRating}
              onChange={async (e) => {
                handleChangeUserRating(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitadas</MenuItem>
              <MenuItem value={"enabled"}>Habilitadas</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserRating && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="schedule-type-label">
              Agendamentos de Expediente
            </InputLabel>
            <Select
              labelId="schedule-type-label"
              value={scheduleType}
              onChange={async (e) => {
                handleScheduleType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"queue"}>Gerenciamento Por Fila</MenuItem>
              <MenuItem value={"company"}>Gerenciamento Por Empresa</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        {/* Comentado componente até que baileys consiga um funcionamento estavel com listas e botões.
        <Grid xs={12} sm={6} md={4} item>
           <FormControl className={classes.selectContainer}>
            <InputLabel id="chatBotType-setting">
              Tipo chatbot
            </InputLabel>
            <Select
              margin="dense"
              id="chatBotType-setting"
              name="chatBotType"
              value={chatbotType}
              onChange={(e) => handleChangeSetting(e, "chatBotType", setChatbotType)}
            >
              <MenuItem value={"text"}>Text</MenuItem>
              <MenuItem value={"button"}>Botão</MenuItem>
              <MenuItem value={"list"}>Lista</MenuItem>
          </Select>
          </FormControl> 
        </Grid>*/}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="transferMessageQueue-setting">
              Mensagem ao Transferir Ticket
            </InputLabel>
            <Select
              margin="dense"
              id="transferMessageQueue-setting"
              name="transferMessageQueue"
              value={transferMessageQueue}
              onChange={(e) => handleChangeSetting(e, "transferMessageQueue", setTransferMessageQueueQueue)}
            >
              <MenuItem value={"true"}>Sim</MenuItem>
              <MenuItem value={"false"}>Não</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </>
  );
}
