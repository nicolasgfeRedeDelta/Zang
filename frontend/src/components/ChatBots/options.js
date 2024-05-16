import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { makeStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import api from "../../services/api";
import Typography from "@material-ui/core/Typography";
import EditIcon from "@material-ui/icons/Edit";
import { Box, CircularProgress, IconButton, Modal, Paper } from "@material-ui/core";
import { Formik, Field, FieldArray } from "formik";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import SaveIcon from "@material-ui/icons/Save";
import TextField from "@material-ui/core/TextField";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import CustomToolTip from "../ToolTips";
import ConfirmationModal from "../ConfirmationModal";
import { i18n } from "../../translate/i18n";
import Switch from "@material-ui/core/Switch";
import { FormControlLabel } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete/Autocomplete";
import { Add } from "@material-ui/icons";
import { AudioRecord } from "../AudioRecord";
import { FileInput } from "../FileInput";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import MicRecorder from "mic-recorder-to-mp3";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";


let hideButton;
let audio;
let posicaoMessages;
let posicaoOptions;

const QueueSchema = Yup.object().shape({
  options: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().min(4, "too short").required("Required"),
      })
    )
    .required("Must have friends"),
});

const useStyles = makeStyles((theme) => ({
  message: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },
  Box: {
    cursor: "pointer",
    alignItems: "center",
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

}));

function getStepContent(step) {
  return <VerticalLinearStepper chatBotId={step} />;
}

export default function VerticalLinearStepper(props) {
  const initialState = {
    name: "",
    greetingMessage: "",
    options: [],
  };

  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(-1);
  const [steps, setSteps] = React.useState(initialState);
  const [loading, setLoading] = React.useState(false);
  const [isStepContent, setIsStepContent] = React.useState(true);
  const [isNameEdit, setIsNamedEdit] = React.useState(null);
  const [isGreetingMessageEdit, setGreetingMessageEdit] = React.useState(null);
  const [selectedQueue, setSelectedQueue] = React.useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [users, setUsers] = useState([]);
  const [modalAnexoOpen, setModalAnexoOpen] = useState(false);
  const Mp3Recorder = new MicRecorder({ bitRate: 128 });
  const [recording, setRecording] = useState(false);
  let body;

  useEffect(() => {
    async function fetchData() {
      await loadUsers();
    }
    fetchData();
  }, []);

  const handleEditBot = async (values, index) => {
    try {
      const { data } = await api.get(`/queue-options/${values.options[index].id}`);
      hideButton = data.options.length;
      setIsNamedEdit(index);
      setIsStepContent(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleSaveBot = async (values) => {
    try {
      if (props.chatBotId) {
        body = await makeFormData(values)
        await api.put(`/queue-options/${props.chatBotId}`, body);
      } else {
        body = await makeFormData(values)
        await api.post("/queue-options", body);
      }
      toast.success("Bot saved successfully");
      const { data } = await api.get(`/queue-options/${props.chatBotId}`);

      setSteps(initialState);
      setSteps(data);
      setIsNamedEdit(null);
      setGreetingMessageEdit(null);

      setSteps(data);
    } catch (err) {
      toastError(err);
    }
  };

  const makeFormData = async (value) => {
    const formData = new FormData();
    value.options.map(async (val) => {
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

  React.useEffect(() => {
    setLoading(true);

    const delayDebounceFn = setTimeout(() => {
      const fetchList = async () => {
        try {
          const { data } = await api.get(`/queue-options/${props.chatBotId}`);
          setSteps(data);
          setLoading(false);
        } catch (err) {
          console.log(err);
        }
      };
      fetchList();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [props.chatBotId]);

  React.useEffect(() => {
    if (activeStep === isNameEdit) {
      setIsStepContent(false);
    } else {
      setIsStepContent(true);
    }
  }, [isNameEdit, activeStep]);

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedQueue(null);
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get(`/users/list`);
      const userList = data.map((u) => ({ id: u.id, name: u.name }));
      setUsers(userList);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteMessages = async (values, index, i) => {
    try {
      values.options[index].messages.splice(i, 1);
      await api.put(`/queue-options/${props.chatBotId}`, values);
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const handleAddMessages = async (values, index) => {
    try {
      values.options[index].messages.push({ message: "", mediaUrl: null, timeSendMessage: 3 });
      await api.put(`/queue-options/${props.chatBotId}`, values);
    } catch (err) {
      toastError(err);
    }
    setSelectedQueue(null);
  };

  const handleDeleteQueue = async (queueId) => {
    try {
      await api.delete(`/queue-options/${queueId}`);
      const { data } = await api.get(`/queue-options/${props.chatBotId}`);
      setSteps(initialState);
      setSteps(data);
      setIsNamedEdit(null);
      setGreetingMessageEdit(null);
      setSteps(data);
      toast.success(i18n.t("Queue deleted successfully!"));
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

  return (
    <div className={classes.root}>
      <ConfirmationModal
        title={
          selectedQueue &&
          `${i18n.t("queues.confirmationModal.deleteTitle")} ${selectedQueue.name
          }?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeleteQueue(selectedQueue.id)}
      >
        {i18n.t("Tem certeza? Todas as opções internas também serão excluídas")}
      </ConfirmationModal>

      {!loading && (
        <div>
          <Formik
            initialValues={steps}
            validateOnChange={false}
            enableReinitialize={true}
            validationSchema={QueueSchema}
            render={({
              touched,
              errors,
              isSubmitting,
              values,
              handleSubmit,
            }) => (
              <FieldArray name="options">
                {({ push, remove }) => (
                  <>
                    <Stepper
                      nonLinear
                      activeStep={activeStep}
                      orientation="vertical"
                    >
                      {values.options &&
                        values.options.length > 0 &&
                        values.options.map((info, index) => (
                          <Step
                            key={`${info.id ? info.id : index}-options`}
                            onClick={() => {
                              setActiveStep(index);
                              setSelectedQueue(info);
                              // values.options.mainChatbot.legth === 0 ? setChildrenSize(true) : setChildrenSize(false);
                            }}                          >
                            <StepLabel key={`${info.id}-options`}>
                              {isNameEdit !== index &&
                                steps.options[index]?.title ? (
                                <div
                                  className={classes.message}
                                  variant="body1"
                                >
                                  {values.options[index].title}

                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditBot(values, index)}                                  >
                                    <EditIcon />
                                  </IconButton>
                                </div>
                              ) : (
                                <>
                                  <Field
                                    as={TextField}
                                    name={`options[${index}].title`}
                                    variant="standard"
                                    color="primary"
                                    disabled={isSubmitting}
                                    autoFocus
                                    error={
                                      touched?.options?.[index]?.title &&
                                      Boolean(errors.options?.[index]?.title)
                                    }
                                    className={classes.textField}
                                  />

                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (values.options[index].title) {
                                        if (!values.options[index].isAgent) {
                                          values.options[index].agentId = null
                                          handleSaveBot(values)
                                        } else if (values.options[index].isAgent &&
                                          values.options[index].agentId !== null) {
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

                                  {/* só deve habilitar quando não tiver proximos chatbots */}
                                  {values.options[index].length > 0 &&
                                    info.messages.map((value, i) => (
                                      isGreetingMessageEdit !== index ? (
                                        <>
                                          < div className={classes.message} >
                                            <Typography
                                              color="textSecondary"
                                              variant="body1"
                                            >
                                              Mensagem:
                                            </Typography>

                                            {values.options[index].messages[i].message}

                                            {!steps.options[index]
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
                                              onClick={() =>
                                                setGreetingMessageEdit(index)
                                              }
                                            >
                                              <EditIcon />
                                            </IconButton>
                                            <IconButton className={classes.addIcon}
                                              width={200}
                                              size="small"
                                              color="default"
                                              onClick={() => {
                                                values.options[index].messages.push({ message: "" });
                                              }}
                                            >
                                              <Add />
                                            </IconButton>
                                          </div>
                                        </>
                                      ) : (
                                        <div className={classes.message}>
                                          <Field
                                            as={TextField}
                                            name={`options[${index}].messages[${i}].message`}
                                            variant="standard"
                                            margin="dense"
                                            fullWidth
                                            multiline
                                            //disabled={desabilited(values.options[index].messages[i].mediaUrl)}
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
                                              setGreetingMessageEdit(null);
                                            }
                                            }
                                            disabled={isSubmitting}
                                          >
                                            {" "}
                                            <SaveIcon />
                                          </IconButton>
                                        </div>
                                      ))
                                    )}
                                  <FormControlLabel
                                    control={
                                      <Field
                                        as={Switch}
                                        color="primary"
                                        disabled={hideButton > 0}
                                        name={`options[${index}].isAgent`}
                                        checked={
                                          values.options[index].isAgent ||
                                          false
                                        }
                                      />
                                    }
                                    label="Atendente"
                                  />
                                  {hideButton > 0 &&
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
                                  }
                                  {values.options[index].isAgent && (
                                    <Autocomplete
                                      style={{ width: 300 }}
                                      value={users.find(user => user.id === values.options[index].agentId)}
                                      getOptionLabel={option => `${option.name}`}
                                      options={users}
                                      onChange={(e, value) => { values.options[0].agentId = value.id }}
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
                                          // onChange={e => setSearchParam(e.target.value)}
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
                                  )}
                                </>
                              )}
                            </StepLabel>
                            {values.options[index].messages.length == 0 && values.options[index].messages.push({ message: "", timeSendMessage: 3 })}
                            {isStepContent && steps.options[index] && (
                              values.options[index].messages.length > 0 &&
                              values.options[index].messages.map((value, i) => (
                                <StepContent>
                                  <>
                                    {isGreetingMessageEdit !== i ? (
                                      <div className={classes.message}>
                                        <Typography
                                          color="textSecondary"
                                          variant="body1"
                                        >
                                          Message:
                                        </Typography>

                                        {values.options[index].messages[i].message}

                                        {!steps.options[index]
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
                                          onClick={() => setGreetingMessageEdit(i)}
                                        >
                                          <EditIcon />
                                        </IconButton>
                                        <IconButton
                                          mt={5}
                                          size="small"
                                          onClick={() => handleDeleteMessages(values, index, i)}
                                        >
                                          <DeleteOutlineIcon />
                                          <CustomToolTip
                                            title=""
                                            content="Se houver uma mensagem escrita no campo, e um áudio for gravado em anexo, a mensagem será excluída."
                                          >
                                            <HelpOutlineOutlinedIcon
                                              color="primary"
                                              fontSize="small"
                                            />
                                          </CustomToolTip>
                                        </IconButton>
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
                                          style={{ width: "35px", maxHeight: "20px" }}
                                          as={TextField}
                                          name={`options[${index}].messages[${i}].timeSendMessage`}
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
                                        <div className={classes.message}>
                                          <Field
                                            as={TextField}
                                            name={`options[${index}].messages[${i}].message`}
                                            variant="standard"
                                            margin="dense"
                                            fullWidth
                                            disabled={values.options[index].messages[i].mediaUrl}
                                            multiline
                                            error={
                                              touched.message &&
                                              Boolean(errors.message)
                                            }
                                            helperText={
                                              touched.message &&
                                              errors.message
                                            }
                                            className={classes.textField}
                                          />

                                          <IconButton
                                            size="small"
                                            onClick={() => handleSaveBot(values)}
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
                                              posicaoOptions = index;
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
                                      name={`options[${index}].messages[${i}].mediaUrl`}
                                      aria-labelledby="modal-modal-title"
                                      aria-describedby="modal-modal-description"
                                    >
                                      <Box className={classes.modalAnexo} >
                                        <FileInput
                                          handleChangeMedias={(e) => {
                                            values.options[posicaoOptions].messages[posicaoMessages].mediaUrl = e.target.files[0];
                                            values.options[posicaoOptions].messages[posicaoMessages].message = null;
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
                                            values.options[posicaoOptions].messages[posicaoMessages].mediaUrl = file;
                                            values.options[posicaoOptions].messages[posicaoMessages].message = null;
                                            setModalAnexoOpen(false);
                                          }}
                                          handleStartRecording={handleStartRecording}
                                        />
                                      </Box>
                                    </Modal>
                                    {values.options[index].messages[i].mediaUrl !== null && values.options[index].messages[i].mediaUrl !== undefined && (
                                      <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
                                        {loading ? (
                                          <div>
                                            <CircularProgress className={classes.circleLoading} />
                                          </div>
                                        ) : (
                                          <span>
                                            {typeof values.options[index].messages[i].mediaUrl === 'string'
                                              ? (values.options[index].messages[i].mediaUrl)
                                              : (values.options[index].messages[i].mediaUrl.name)}
                                          </span>
                                        )}
                                      </Paper>
                                    )}
                                    {(!values.options[index].isAgent && values.options[index].messages.length - 1) === i && (
                                      getStepContent(info.id)
                                    )}
                                  </>
                                </StepContent>
                              ))
                            )}
                          </Step>
                        ))}
                      <Step>
                        <StepLabel
                          onClick={() =>
                            push({
                              title: undefined,
                              messages: [{ message: "" }],
                            })
                          }
                        >
                          Adiconar opções
                        </StepLabel>
                      </Step>
                    </Stepper>
                  </>
                )}
              </FieldArray>
            )}
          />
        </div>
      )
      }
    </div >
  );
}
