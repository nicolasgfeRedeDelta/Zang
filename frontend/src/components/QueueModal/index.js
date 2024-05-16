import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import CustomToolTip from "../ToolTips";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import EditIcon from "@material-ui/icons/Edit";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import SaveIcon from "@material-ui/icons/Save";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";

import OptionsChatBot from "../ChatBots/options";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ColorPicker from "../ColorPicker";
import {
  Box,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Modal,
  Paper,
  Switch,
  Tab,
  Tabs,
} from "@material-ui/core";
import { Add, Colorize, Queue, WhatsApp } from "@material-ui/icons";
import SchedulesForm from "../SchedulesForm";
import ConfirmationModal from "../ConfirmationModal";
import Autocomplete from "@material-ui/lab/Autocomplete/Autocomplete";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import { FileInput } from "../FileInput";
import { AudioRecord } from "../AudioRecord";
import MicRecorder from "mic-recorder-to-mp3";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import SelectAllComponent from "../SelectAllComponent";

let hideButton;
let audio;
let posicaoMessages;
let posicaoChatbots;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: theme.spacing(1),
    flex: 1,
  },
  btnWrapper: {
    position: "relative",
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
  message: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },
  custom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalAnexo: {
    backgroundColor: 'white',
    textAlign: 'center',
    marginTop: '23%',
    marginLeft: '77%',
    maxWidth: '200px',
    maxHeight: '50px',
    display: 'flex',
    position: 'absolute',
    flexDirection: 'row',
    borderRadius: '3px'
  },
  btnSwitch: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  select: {
    marginLeft: 10,
    width: 350
  }
}));

const QueueSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  color: Yup.string().min(3, "Too Short!").max(9, "Too Long!").required(),
  greetingMessage: Yup.string(),
});

const QueueModal = ({ open, onClose, queueId, onEdit }) => {
  const classes = useStyles();

  const initialState = {
    name: "",
    color: "",
    greetingMessage: "",
    outOfHoursMessage: "",
    chatbots: [],

  };

  const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
  const [queue, setQueue] = useState(initialState);
  const [tab, setTab] = useState(0);
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);
  const greetingRef = useRef();

  const [activeStep, setActiveStep] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isStepContent, setIsStepContent] = useState(true);
  const [isNameEdit, setIsNamedEdit] = useState(null);
  const [isMessageEdit, setMessageEdit] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = React.useState(false);
  const [teste, setTeste] = useState(false)
  const [modalAnexoOpen, setModalAnexoOpen] = useState(false);
  const Mp3Recorder = new MicRecorder({ bitRate: 128 });
  const [recording, setRecording] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [userOption, setUserOption] = useState([]);
  const [queueSequenceId, setQueueSequenceId] = useState([]);
  const [autoSelectUser, setAutoSelectUser] = useState();
  let body;

  const [schedules, setSchedules] = useState([
    {
      weekday: "Segunda-feira",
      weekdayEn: "monday",
      startTime: "",
      endTime: "",
    },
    {
      weekday: "Terça-feira",
      weekdayEn: "tuesday",
      startTime: "",
      endTime: "",
    },
    {
      weekday: "Quarta-feira",
      weekdayEn: "wednesday",
      startTime: "",
      endTime: "",
    },
    {
      weekday: "Quinta-feira",
      weekdayEn: "thursday",
      startTime: "",
      endTime: "",
    },
    { weekday: "Sexta-feira", weekdayEn: "friday", startTime: "", endTime: "" },
    { weekday: "Sábado", weekdayEn: "saturday", startTime: "", endTime: "" },
    { weekday: "Domingo", weekdayEn: "sunday", startTime: "", endTime: "" },
  ]);

  useEffect(() => {
    api.get(`/settings`).then(({ data }) => {
      if (Array.isArray(data)) {
        const scheduleType = data.find((d) => d.key === "scheduleType");
        if (scheduleType) {
          setSchedulesEnabled(scheduleType.value === "queue");
        }
      }
    });
  }, []);

  useEffect(() => {
    handleFindUserQueue();
    setLoading(true);
    (async () => {
      if (!queueId) return;
      try {
        const { data } = await api.get(`/queue/${queueId}`);
        setQueue((prevState) => {
          return { ...prevState, ...data };
        });
        setAutoSelectUser(data.autoSelectUser)
        let userid = [];
        let queueSequenceId = []
        data.QueuesSequenceUser.map((queueSequenceData) => {
          userid.push(queueSequenceData.userId);
          queueSequenceId.push(queueSequenceData.id);
        })
        setQueueSequenceId(queueSequenceId)
        setSelectedModules(userid);
        setSchedules(data.schedules);
        setLoading(false);
      } catch (err) {
        toastError(err);
      }
    })();

    return () => {
      setQueue({
        name: "",
        color: "",
        greetingMessage: "",
        chatbots: [],
      });
    };
  }, [queueId, open]);

  useEffect(() => {
    async function fetchData() {
      await loadUsers();
    }
    fetchData();
  }, []);

  const handleClose = () => {
    onClose();
    setQueue(initialState);
  };

  const handleSaveQueue = async (values) => {
    try {
      if (queueId) {
        values.autoSelectUser = autoSelectUser;
        await api.put(`/queue/${queueId}`, { ...values, schedules, QueuesSequenceUser: selectedModules, queueSequenceId: queueSequenceId });
      } else {
        await api.post("/queue", { ...values, schedules });
      }
      toast.success("Queue saved successfully");
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveSchedules = async (values) => {
    toast.success("Clique em salvar para registar as alterações");
    setSchedules(values);
    setTab(0);
  };


  const handleFindUserQueue = async () => {
    let userOpt = [];
    try {
      if (usersData[0]) {
        usersData.map((userQueue) => {
          userQueue.queues.map((queue) => {
            if (queue.id == queueId) {
              let formatedOption = {};
              formatedOption = { id: userQueue.id, nome: userQueue.name };
              userOpt.push(formatedOption);
            }
          })
        })
      }
      setUserOption(userOpt)
    } catch (err) {
      toastError(err);
    }
  };

  const handleEditBot = async (values, index) => {
    try {
      const { data } = await api.get(`/queue-options/${values.chatbots[index].id}`);
      setIsNamedEdit(index);
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveBot = async (values) => {
    try {
      if (queueId) {
        body = await makeFormData(values)
        const { data } = await api.put(`/queue/${queueId}`, body);
        if (data.chatbots && data.chatbots.length) {
          onEdit(data);
          setQueue(data);
        }
      } else {
        body = await makeFormData(values)
        const { data } = await api.post("/queue", body);
        if (data.chatbots && data.chatbots.length) {
          setQueue(data);
          onEdit(data);
          handleClose();
        }
      }

      setIsNamedEdit(null)
      setMessageEdit(null)
      toast.success("Queue saved successfully");

    } catch (err) {
      toastError(err);
    }
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async (queueId, funcionRemove, index) => {
    try {
      await api.delete(`/queue-options/${queueId}`);
      // const { data } = await api.get(`/queue-options/${null}`);
      funcionRemove(index);
      setIsNamedEdit(null);
      setSelectedQueue(null);
      setActiveStep(null);
      toast.success(i18n.t("Queue deleted successfully!"));
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get(`/users/list`);
      setUsersData(data);
      const userList = data.map((u) => ({ id: u.id, name: u.name }));
      setUsers(userList);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteMessages = async (values, index, i) => {
    try {
      values.chatbots[index].messages.splice(i, 1);
      await api.put(`/queue/${queueId}`, values);
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const handleAddMessages = async (values, index) => {
    try {
      values.chatbots[index].messages.push({ message: "", mediaUrl: null, timeSendMessage: 3 });
      await api.put(`/queue/${queueId}`, values);
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      audio = Mp3Recorder;
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleCancelAudio = async () => {
    try {
      await audio.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const desabilited = (values) => {
    if (values != null) {
      let ext = values.split('.').pop()
      return (ext === "mp3");
    }
  };

  const makeFormData = async (value) => {
    const formData = new FormData();
    value.chatbots.map(async (val) => {
      val.messages.map(async (msg) => {
        if (typeof msg.mediaUrl != 'string' && msg.mediaUrl != null) {
          if (msg.mediaUrl.type) {
            formData.append("files", msg.mediaUrl);
            msg['mimetype'] = msg.mediaUrl.type;
            const ext = msg.mediaUrl.type.split("/")[1].split(";")[0];
            let filename = `${new Date().getTime()}.${ext}`;
            msg.mediaUrl = filename;
          } else {
            try {
              formData.append("files", msg.mediaUrl.blob);
              msg['mimetype'] = msg.mediaUrl.blob.type;
              msg.mediaUrl = msg.mediaUrl.filename;
            } catch (err) {
              toastError(err);
            }
          }
          msg['fileAdd'] = true;
        }
      })
    })
    formData.append("recipe", JSON.stringify(value));
    return formData
  }
  return (
    <div className={classes.root}>
      <Dialog
        maxWidth="lg"
        fullWidth={true}
        open={open}
        onClose={handleClose}
        scroll="paper"
      >
        <DialogTitle
        >
          {queueId
            ? `${i18n.t("queueModal.title.edit")}`
            : `${i18n.t("queueModal.title.add")}`}
        </DialogTitle>

        <Formik
          initialValues={queue}
          validateOnChange={false}
          enableReinitialize={true}
          validationSchema={QueueSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveQueue(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ handleChange, touched, errors, isSubmitting, values }) => (
            <>
              <Tabs
                value={tab}
                indicatorColor="primary"
                textColor="primary"
                onChange={(_, v) => setTab(v)}
                aria-label="disabled tabs example"
              >
                <Tab label="Dados da Fila"
                />

                <Tab label="Opções"
                />

                <Tab label="Sequência"
                />

                {schedulesEnabled && <Tab label="Horários de Atendimento" />}
              </Tabs>
              <Paper>
                <Form
                  style={{ width: "100%" }}
                >
                  <DialogContent dividers={true}>
                    {tab === 0 && (
                      <>
                        <Field
                          as={TextField}
                          label={i18n.t("queueModal.form.name")}
                          autoFocus
                          name="name"

                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                          variant="outlined"
                          margin="dense"
                          className={classes.textField}
                        />
                        <Field
                          as={TextField}
                          label={i18n.t("queueModal.form.color")}
                          name="color"
                          id="color"
                          onFocus={() => {
                            setColorPickerModalOpen(true);
                            greetingRef.current.focus();
                          }}
                          error={touched.color && Boolean(errors.color)}
                          helperText={touched.color && errors.color}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <div
                                  style={{ backgroundColor: values.color }}
                                  className={classes.colorAdorment}
                                ></div>
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => setColorPickerModalOpen(true)}
                              >
                                <Colorize />
                              </IconButton>
                            ),
                          }}
                          variant="outlined"
                          margin="dense"
                        />
                        <ColorPicker
                          open={colorPickerModalOpen}
                          handleClose={() => setColorPickerModalOpen(false)}
                          onChange={(color) => {
                            values.color = color;
                            setQueue(() => {
                              return { ...values, color };
                            });
                          }}
                        />
                        <div>
                          <Field
                            as={TextField}
                            label={i18n.t("queueModal.form.greetingMessage")}
                            type="greetingMessage"
                            multiline
                            inputRef={greetingRef}
                            minRows={5}
                            fullWidth
                            name="greetingMessage"
                            width="60"
                            error={
                              touched.greetingMessage && Boolean(errors.greetingMessage)
                            }
                            helperText={
                              touched.greetingMessage && errors.greetingMessage
                            }
                            variant="outlined"
                            margin="dense"
                          />
                        </div>
                      </>
                    )}
                    {tab === 1 && (
                      <>
                        <Typography variant="subtitle1">
                          Opções
                          <CustomToolTip
                            title="Adicione opções para construir um chatbot"
                            content="Se houver apenas uma opção, ela será escolhida automaticamente, fazendo com que o bot responda com a mensagem da opção e siga adiante"
                          >
                            <HelpOutlineOutlinedIcon
                              color="primary"
                              style={{ marginLeft: "14px" }}
                              fontSize="small"
                            />
                          </CustomToolTip>
                        </Typography>
                        <div>

                          <FieldArray name="chatbots">
                            {({ push, remove }) => (
                              <>
                                <Stepper
                                  nonLinear
                                  activeStep={activeStep}
                                  orientation="vertical"
                                >
                                  {values.chatbots &&
                                    values.chatbots.length > 0 &&
                                    values.chatbots.map((info, index) => (

                                      <Step
                                        key={`${info.id ? info.id : index}-chatbots`}
                                        onClick={() => {
                                          setActiveStep(index)
                                        }}
                                      >
                                        <ConfirmationModal
                                          title={
                                            "Excluir Opção"
                                          }
                                          open={confirmModalOpen}
                                          onClose={handleCloseConfirmationModal}
                                          onConfirm={() => handleDeleteQueue(selectedQueue.id, remove, index - 1)}
                                        >
                                          {i18n.t("Tem certeza? Todas as opções internas também serão excluídas")}
                                        </ConfirmationModal>
                                        <StepLabel key={`${info.id}-chatbots`}>
                                          {isNameEdit !== index &&
                                            queue.chatbots[index]?.title ? (
                                            <div
                                              className={classes.message}
                                              variant="body1"
                                            >
                                              {values.chatbots[index].title}
                                              <IconButton
                                                size="small"
                                                onClick={() => handleEditBot(values, index)}//botao de editar mensagem
                                              >
                                                <EditIcon />
                                              </IconButton>
                                            </div>
                                          ) : (
                                            <>
                                              <Field
                                                as={TextField}
                                                name={`chatbots[${index}].title`}
                                                variant="standard"
                                                color="primary"
                                                disabled={isSubmitting}
                                                autoFocus
                                                error={
                                                  touched?.chatbots?.[index]?.title &&
                                                  Boolean(
                                                    errors.chatbots?.[index]?.title
                                                  )
                                                }
                                                className={classes.textField}
                                              />

                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  if (values.chatbots[index].title) {
                                                    if (!values.chatbots[index].isAgent) {
                                                      values.chatbots[index].agentId = null
                                                      handleSaveBot(values)
                                                    } else if (values.chatbots[index].isAgent &&
                                                      values.chatbots[index].agentId !== null) {
                                                      handleSaveBot(values)
                                                    }
                                                  }
                                                }
                                                }
                                                disabled={isSubmitting}
                                              >
                                                <SaveIcon />
                                              </IconButton>

                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  setSelectedQueue(info);
                                                  setConfirmModalOpen(true);
                                                }}
                                                disabled={isSubmitting}
                                              >
                                                <DeleteOutline />
                                              </IconButton>
                                              <br />
                                              <FormControlLabel
                                                control={
                                                  <Field
                                                    as={Switch}
                                                    color="primary"
                                                    disabled={hideButton > 0}
                                                    name={`chatbots[${index}].isAgent`}
                                                    checked={
                                                      values.chatbots[index].isAgent ||
                                                      false
                                                    }
                                                  />
                                                }
                                                label="Atendente"
                                              />
                                              {hideButton > 0 && (
                                                <CustomToolTip
                                                  title="Para habilitar o botão Atendente"
                                                  content="Não pode ter opções vinculadas a ele. Deve ser a ultima opção da fila"
                                                >
                                                  <HelpOutlineOutlinedIcon
                                                    color="primary"
                                                    style={{ marginLeft: "4px" }}
                                                    fontSize="small"
                                                  />
                                                </CustomToolTip>
                                              )}

                                              {values.chatbots[index].isAgent && (
                                                <Autocomplete
                                                  style={{ width: 300 }}
                                                  value={users.find(user => user.id === values.chatbots[index].agentId)}
                                                  getOptionLabel={option => `${option.name}`}
                                                  options={users}
                                                  onChange={(e, value) => {
                                                    return value ? values.chatbots[index].agentId = value.id : values.chatbots[0].agentId = "";
                                                  }}
                                                  freeSolo
                                                  autoHighlight
                                                  noOptionsText={i18n.t("queues.options.selectUser")}
                                                  loading={loading}
                                                  renderInput={params => (
                                                    <TextField
                                                      as={TextField}
                                                      {...params}
                                                      label={i18n.t("queues.options.selectUser")}
                                                      variant="outlined"
                                                      required
                                                      autoFocus
                                                      InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                          <React.Fragment>
                                                            {loading ? (
                                                              <CircularProgress color="inherit" size={20} />
                                                            ) : null}
                                                            {params.InputProps.endAdornment}
                                                          </React.Fragment>
                                                        ),
                                                      }}
                                                    />
                                                  )}
                                                />
                                              )
                                              }
                                            </>
                                          )}
                                        </StepLabel>
                                        {values.chatbots[index].messages.length == 0 && values.chatbots[index].messages.push({ message: "", timeSendMessage: 3 })}
                                        {isStepContent && queue.chatbots[index] && (
                                          values.chatbots[index].messages.length > 0 &&
                                          values.chatbots[index].messages.map((value, i) => (
                                            <StepContent>
                                              <>
                                                {isMessageEdit !== i ? (
                                                  <div
                                                    className={classes.message}
                                                  >
                                                    <Typography
                                                      color="textSecondary"
                                                      variant="body1"
                                                    >
                                                      Mensagem:
                                                    </Typography>

                                                    {values.chatbots[index].messages[i].message}

                                                    {!queue.chatbots[index]
                                                      ?.messages[i] && (
                                                        <CustomToolTip
                                                          title="A mensagem é obrigatória para seguir ao próximo nível"
                                                          content="Se a mensagem não estiver definida, o bot não seguirá adiante"
                                                        >
                                                          <HelpOutlineOutlinedIcon
                                                            color="primary"
                                                            style={{ marginLeft: "4px" }}
                                                            fontSize="small"
                                                          />
                                                        </CustomToolTip>
                                                      )}

                                                    <IconButton
                                                      size="small"
                                                      onClick={() => {
                                                        setMessageEdit(i)
                                                      }
                                                      }
                                                    >
                                                      <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                      mt={5}
                                                      size="small"
                                                      onClick={() => handleDeleteMessages(values, index, i)}
                                                    >
                                                      <DeleteOutlineIcon />
                                                    </IconButton>
                                                    <CustomToolTip
                                                      title=""
                                                      content="Se houver uma mensagem escrita no campo, e um áudio for gravado em anexo, a mensagem será excluída."
                                                    >
                                                      <HelpOutlineOutlinedIcon
                                                        color="primary"
                                                        fontSize="small"
                                                      />
                                                    </CustomToolTip>
                                                    {i === 0 &&
                                                      <IconButton className={classes.addIcon}
                                                        width={200}
                                                        size="small"
                                                        color="default"
                                                        onClick={() => handleAddMessages(values, index)}
                                                      >
                                                        <Add />
                                                      </IconButton>}

                                                  </div>
                                                ) : (
                                                  <>
                                                    Aguardar <Field
                                                      style={{ width: "40px", maxHeight: "20px" }}
                                                      as={TextField}
                                                      name={`chatbots[${index}].messages[${i}].timeSendMessage`}
                                                      type="number"
                                                      onInput={(e) => {
                                                        e.target.value = Math.max(0, parseInt(e.target.value) || 0).toString().slice(0, 10);
                                                      }}
                                                      variant="standard"
                                                      error={
                                                        touched.timeSendMessage &&
                                                        Boolean(errors.timeSendMessage)
                                                      }
                                                      helperText={
                                                        touched.timeSendMessage &&
                                                        errors.timeSendMessage
                                                      }
                                                      className={classes.textField}
                                                    /> segundos antes de enviar a mensagem
                                                    <CustomToolTip
                                                      title=""
                                                      content="Defina em quantos segundos a próxima mensagem será enviada"
                                                    >
                                                      <HelpOutlineOutlinedIcon
                                                        color="primary"
                                                        style={{ marginLeft: "4px" }}
                                                        fontSize="small"
                                                      />
                                                    </CustomToolTip>
                                                    <div
                                                      className={classes.message}
                                                    >
                                                      <Field
                                                        as={TextField}
                                                        name={`chatbots[${index}].messages[${i}].message`}
                                                        variant="standard"
                                                        margin="dense"
                                                        fullWidth
                                                        multiline
                                                        disabled={values.chatbots[index].messages[i].mediaUrl}
                                                        error={
                                                          touched.message &&
                                                          Boolean(errors.message)
                                                        }
                                                        helperText={
                                                          touched.message &&
                                                          errors.message
                                                        }
                                                        className={classes.textField}
                                                        inputProps={{ maxLength: 1024 }}
                                                      />

                                                      <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                          handleSaveBot(values)
                                                        }}
                                                        disabled={isSubmitting}
                                                      >
                                                        {" "}
                                                        <SaveIcon />
                                                      </IconButton>
                                                      <IconButton className={classes.addIcon}
                                                        width={200}
                                                        size="small"
                                                        color="default"
                                                        onClick={() => {
                                                          setModalAnexoOpen(true)
                                                          posicaoChatbots = index;
                                                          posicaoMessages = i
                                                        }}
                                                      >
                                                        <AttachFileIcon />
                                                      </IconButton>
                                                    </div>
                                                  </>
                                                )}
                                                <Modal
                                                  open={modalAnexoOpen}
                                                  onClose={() => setModalAnexoOpen(false)}
                                                  name={`chatbots[${index}].messages[${i}].mediaUrl`}
                                                  aria-labelledby="modal-modal-title"
                                                  aria-describedby="modal-modal-description"
                                                >
                                                  <Box className={classes.modalAnexo} >
                                                    <FileInput
                                                      handleChangeMedias={(e) => {
                                                        values.chatbots[posicaoChatbots].messages[posicaoMessages].mediaUrl = e.target.files[0];
                                                        values.chatbots[posicaoChatbots].messages[posicaoMessages].message = null;
                                                        setModalAnexoOpen(false);
                                                      }}
                                                    />
                                                    <AudioRecord
                                                      loading={loading}
                                                      recording={recording}
                                                      handleCancelAudio={handleCancelAudio}
                                                      handleUploadAudio={async (e) => {
                                                        const [, blob] = await audio.stop().getMp3();
                                                        if (blob.size < 10000) {
                                                          setLoading(false);
                                                          setRecording(false);
                                                          return;
                                                        }
                                                        setRecording(false)
                                                        setLoading(false)
                                                        const filename = `audio-record-site-${new Date().getTime()}.mpeg`;
                                                        const file = { blob: blob, filename: filename }
                                                        values.chatbots[posicaoChatbots].messages[posicaoMessages].mediaUrl = file;
                                                        values.chatbots[posicaoChatbots].messages[posicaoMessages].message = null;
                                                        setModalAnexoOpen(false);
                                                      }}
                                                      handleStartRecording={handleStartRecording}
                                                    />
                                                  </Box>
                                                </Modal>
                                                {console.log("values.chatbots[index].messages[i].mediaUrl", values.chatbots[index].messages[i].mediaUrl)}
                                                {values.chatbots[index].messages[i].mediaUrl !== null && values.chatbots[index].messages[i].mediaUrl !== undefined && (
                                                  <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
                                                    {loading ? (
                                                      <div>
                                                        <CircularProgress className={classes.circleLoading} />
                                                      </div>
                                                    ) : (
                                                      <span>
                                                        {typeof values.chatbots[index].messages[i].mediaUrl === 'string'
                                                          ? (values.chatbots[index].messages[i].mediaUrl)
                                                          : (values.chatbots[index].messages[i].mediaUrl.name)}
                                                      </span>
                                                    )}
                                                  </Paper>
                                                )}
                                                {(!values.chatbots[index].isAgent &&
                                                  values.chatbots[index].messages.length - 1) === i && (
                                                    <OptionsChatBot chatBotId={info.id} />
                                                  )}
                                              </>
                                            </StepContent>
                                          ))
                                        )}
                                      </Step>
                                    ))}
                                  <Step>
                                    <StepLabel
                                      onClick={() => push({ title: "", messages: [{ message: "", mediaUrl: null, timeSendMessage: 3 }] })}
                                    >
                                      Adiconar opções
                                    </StepLabel>
                                  </Step>
                                </Stepper>
                              </>
                            )}
                          </FieldArray>
                        </div>
                      </>
                    )}
                    {tab === 2 && (
                      <div>
                        <div className={classes.btnSwitch} style={{ paddingLeft: "15px" }}>
                          <Grid>
                            <FormControlLabel
                              control={
                                <Field
                                  as={Switch}
                                  color="primary"
                                  name="autoSelectUser"
                                  checked={autoSelectUser} 
                                  onChange={()=>{
                                    setAutoSelectUser(!autoSelectUser)
                                  }}
                                />
                              }
                              label={i18n.t("Encaminhamento automático")}
                            />
                          </Grid>
                          <div style={{ marginRight: "860px" }}>
                            <CustomToolTip
                              title={i18n.t("Define a ordem cíclica de atendimento, se o usuário 1 estiver disponível, o próximo ticket a cair na fila será atribuído a ele. O seguinte, ao usuário 2 e assim sucessivamente")}
                              placement="right"
                            >
                              <HelpOutlineOutlinedIcon
                                color="primary"
                              />
                            </CustomToolTip >
                            <CustomToolTip
                               title={
                                <div>
                                  Somente aparecerão no campo de seleção os usuário que estiverem VINCULADOS nesta fila.<br/>
                                  Para que o usuário veja os tickets, o mesmo deve estar atribuído às conexões que utilizam essa fila.
                                </div>
                              }
                              placement="right"
                              style={{ margin: "3px" }}
                            >
                              <HelpOutlineOutlinedIcon color="primary" />
                            </CustomToolTip>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Grid className={classes.select} >
                            <SelectAllComponent
                              opcoes={userOption}
                              placeholder={'Usuarios'}
                              selectedModules={selectedModules}
                              onChange={values => {
                                setSelectedModules(values);
                              }}
                            />
                          </Grid>
                          <div style={{ marginLeft: '8px' }}>
                            <CustomToolTip
                              title={i18n.t("Selecione os usuários para definir a ordem, o primeiro selecionado será o primeiro no ciclo de atendimento. Usuários que não forem selecionados ficarão fora do ciclo (não terão tickets atribuídos automaticamente a eles).")}
                              placement="right"
                            >
                              <HelpOutlineOutlinedIcon color="primary" />
                            </CustomToolTip>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                  <DialogActions
                    absolute={true}
                  >
                    <Button
                      onClick={handleClose}
                      // color="secondary"
                      disabled={isSubmitting}
                    // variant="outlined"
                    >
                      {i18n.t("queueModal.buttons.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      color="primary"
                      disabled={isSubmitting}
                      variant="contained"
                      className={classes.btnWrapper}
                    >
                      {queueId
                        ? `${i18n.t("queueModal.buttons.okEdit")}`
                        : `${i18n.t("queueModal.buttons.okAdd")}`}
                      {isSubmitting && (
                        <CircularProgress
                          size={24}
                          className={classes.buttonProgress}
                        />
                      )}
                    </Button>
                  </DialogActions>
                </Form>
              </Paper>
            </>
          )}
        </Formik>
      </Dialog>
    </div >
  );
};

export default QueueModal; 