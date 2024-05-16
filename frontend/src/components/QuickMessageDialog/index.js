import React, { useState, useEffect, useContext, useRef } from 'react';
import { Button, TextField, DialogContent, DialogActions, Grid, InputAdornment, IconButton, withWidth, Box, Modal, Typography } from '@material-ui/core';
import PropType from 'prop-types'
import Dialog from '../Dialog';
import * as Yup from "yup";
import { Formik, Form, Field, FieldArray } from "formik";
import { i18n } from '../../translate/i18n';
import { makeStyles } from '@material-ui/core/styles';
import ButtonWithSpinner from '../ButtonWithSpinner';
import { AuthContext } from "../../context/Auth/AuthContext";
import MicRecorder from "mic-recorder-to-mp3";
import { isNil, isObject, has, get } from 'lodash';
import ColorPicker from '../ColorPicker';
import { Add, Colorize, Style } from '@material-ui/icons';
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import { FileInput } from '../FileInput';
import toastError from '../../errors/toastError';
import { AudioRecord } from '../AudioRecord';
import Paper from "@material-ui/core/Paper";
import CancelIcon from "@material-ui/icons/Cancel";
import CircularProgress from "@material-ui/core/CircularProgress";
import CustomToolTip from "../ToolTips";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import { useMedia } from '../../context/useMedia';
import QuickMessagesSelect from '../QuickMessagesSelect';
import { Can } from '../Can';
import { toast } from 'react-toastify';

let posicao;
let audio;

const MessageSchema = Yup.object().shape({
    shortcode: Yup.string()
        .min(3, "Too Short!")
        .max(50, "Too Long!")
        .required("Required")
});

const useStyles = makeStyles((theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '500px',
        },
    },
    textField: {
        marginRight: theme.spacing(1),
        flex: 1,
        borderLeft: "20px"
    },
    list: {
        width: '100%',
        maxWidth: '350px',
        maxHeight: '200px',
        backgroundColor: theme.palette.background.paper,
    },
    inline: {
        width: '100%'
    },

    form: {
        width: '600px'
    },

    addButton: {
        left: '415px',
        height: '26px'
    },

    dialogContent: {
        padding: '0px',
        display: 'flex',
        alignItems: 'center'
    },

    addIcon: {
        display: 'flex',
        marginTop: '17%'
    },

    modalAnexo: {
        backgroundColor: 'white',
        textAlign: 'center',
        marginTop: '23%',
        marginLeft: '58%',
        maxWidth: '200px',
        maxHeight: '50px',
        display: 'flex',
        position: 'absolute',
        flexDirection: 'row',
        borderRadius: '3px'
    },

    viewMediaInputWrapper: {
        display: "flex",
        margin: "5px",
        marginRight: "250px",
        height: "40px",
        position: "relative",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        minWidth: "291px"
    },
    select: {
        marginLeft: 10,
        marginRight: 40
    }
}));

function QuickMessageDialog(props) {
    const classes = useStyles()

    const initialMessage = {
        id: null,
        color: '#00000',
        shortcode: '',
        messages: [{ message: '', mediaUrl: null }]
    };

    const [colorPickerMessageOpen, setColorPickerMessageOpen] = useState(false);
    const greetingRef = useRef();
    const { modalOpen, saveMessage, editMessage, onClose, messageSelected, editMessageRemoveMedia } = props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [messages, setMessages] = useState(initialMessage);
    const [loading, setLoading] = useState(false);
    const [modalAnexoOpen, setModalAnexoOpen] = useState(false)
    const Mp3Recorder = new MicRecorder({ bitRate: 128 });
    const [recording, setRecording] = useState(false);
    const { user } = useContext(AuthContext);
    const { medias, handleChangeMedias, cleanMedia } = useMedia();
    const [selectedModules, setSelectedModules] = useState([])

    useEffect(() => {
        verifyAndSetMessage()
        setDialogOpen(modalOpen)
        // setSelectedModules(messageSelected.modules)
    }, [modalOpen])

    useEffect(() => {
        verifyAndSetMessage()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageSelected])

    useEffect(() => {
        const fetchUser = async () => {
            if (!messageSelected.id) return;
            try {
                setSelectedModules(messageSelected.modules.map(module => module.modules));
            } catch (err) {
                toastError(err);
            }
        };
        fetchUser();
    }, [messageSelected, modalOpen]);

    function limitArrayLength(value, tamanhoMaximo) {
        if (value.length > tamanhoMaximo) {
            value.length = tamanhoMaximo;
        }
        return value;
    }

    const validateModules = (values) => {
        let length = 0
        let hasFile = []
        if (selectedModules != []) {
            selectedModules.map((modules, i) => {
                const validateValue = values ? values.messages : [''];
                length = validateValue.length
                if (modules === "Agendamentos") {
                    if (length === 1 && messages.messages.length === 1 && messages.messages[0].mediaUrl === null) {
                        console.log("atribuido para AGENDAMENTOS");
                    } else {
                        toastError("Apenas mensagens rápidas com 1 resposta e sem mídia podem ser atribuídas em AGENDAMENTOS.");
                        selectedModules.splice(i, 1);
                    }
                } else if (modules === "Campanhas") {
                    for (let i = 0; i < length; i++) {
                        if (validateValue[i].mediaUrl != null) {
                            hasFile.push(validateValue[i].mediaUrl);
                        }
                    }
                    if (hasFile.length === 1) {
                        if (length < 7) {
                            console.log("atribuido para CAMPANHAS com uma midia");
                        } else {
                            toastError("Só é permitido adicionar 5 mensagens e 1 arquivo de mídia em CAMPANHAS.");
                            selectedModules.splice(i, 1);
                        }
                    } else if (hasFile.length > 1) {
                        toastError("Só é permitido adicionar 5 mensagens e 1 arquivo de mídia em CAMPANHAS.");
                        selectedModules.splice(i, 1);
                    }
                    if (length < 6) {
                        console.log("atribuido para CAMPANHAS");
                    } else {
                        toastError("Só é permitido adicionar 5 mensagens e 1 arquivo de mídia em CAMPANHAS.");
                        selectedModules.splice(i, 1);
                    }

                }
            })
        }
    }

    const messageSelectedIsValid = () => {
        return isObject(messageSelected) && has(messageSelected, 'id') && !isNil(get(messageSelected, 'id'))
    }

    const verifyAndSetMessage = () => {
        if (messageSelectedIsValid()) {
            const { id, color, messages, shortcode } = messageSelected
            setMessages({ id, color, messages, shortcode })
        } else {
            setMessages(initialMessage)
        }
    }

    const handleClose = () => {
        onClose()
        setLoading(false)
        setSelectedModules([])
    }

    const handleSave = async (values) => {
        const quickMessagesData = { ...values, modules: selectedModules };
        if (messageSelectedIsValid()) {
            editMessage({
                ...messageSelected,
                ...quickMessagesData,
                userId: user.id
            });
        } else {
            saveMessage({
                ...quickMessagesData,
                userId: user.id
            });
        }
        handleClose()
    }

    const handleStartRecording = async () => {
        setLoading(true);
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            await Mp3Recorder.start();
            audio = Mp3Recorder
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
            let ext
            if (values.name == null) {
                ext = values.split('.').pop()
            } else {
                ext = values.type.split('/').pop()
            }
            return (ext === "mp3");
        }
    };

    const handleEditRemovedMedia = async (values) => {
        const quickMessagesData = { ...values, modules: selectedModules };
        if (messageSelectedIsValid()) {
            editMessageRemoveMedia({
                ...messageSelected,
                ...quickMessagesData,
                userId: user.id
            });
        } else if (quickMessagesData) {
            editMessageRemoveMedia({
                ...messageSelected,
                ...quickMessagesData,
                userId: user.id
            });
        }
    };

    return (
        <Dialog
            title="Mensagem Rápida"
            modalOpen={dialogOpen}
            onClose={handleClose}
        >
            <Formik
                initialValues={messages}
                enableReinitialize={true}
                validationSchema={MessageSchema}
                onSubmit={(values, actions) => {
                    setLoading(true)
                    setTimeout(() => {
                        handleSave(values);
                        actions.setSubmitting(false);
                    }, 400);
                }}
            >

                {({ touched, errors, values }) => (
                    <Form className={classes.form}>
                        <DialogContent className={classes.root} dividers>
                            <Grid direction="column" container >
                                <Grid item>
                                    <Field
                                        as={TextField}
                                        name="shortcode"
                                        label={i18n.t("quickMessages.dialog.shortcode")}
                                        error={touched.shortcode && Boolean(errors.shortcode)}
                                        helperText={touched.shortcode && errors.shortcode}
                                        variant="outlined"
                                    />
                                </Grid>
                                <DialogContent className={classes.dialogContent} dividers>
                                    <Grid item>
                                        <CustomToolTip
                                            title=""
                                            content="Se houver uma mensagem escrita no campo, e uma midia for anexada, a mensagem será excluída."
                                        >
                                            <HelpOutlineOutlinedIcon
                                                color="primary"
                                                style={{ marginLeft: "14px" }}
                                                fontSize="small"
                                            />
                                        </CustomToolTip>
                                        <FieldArray name="messages" onChange={validateModules(values)}>
                                            {({ push, remove }) => (
                                                <>
                                                    {values.messages.map((msg, index) => (
                                                        <Grid
                                                            container
                                                            direction="row"
                                                            justifyContent="flex-end"
                                                            alignItems="flex-end"
                                                        >
                                                            <div style={{ display: "flex", marginBottom: "4px", marginRight: "125px", marginLeft: "15px", alignItems: "center" }}>
                                                                {index !== 0 && (
                                                                    <>
                                                                        Aguardar <Field
                                                                            style={{ width: "40px" }}
                                                                            as={TextField}
                                                                            name={`messages[${index}].timeSendMessage`}
                                                                            type="number"
                                                                            onInput={(e) => {
                                                                                e.target.value = Math.max(3, parseInt(e.target.value) || 3).toString().slice(0, 3);
                                                                            }}
                                                                            variant="standard"
                                                                            error={touched.timeSendMessage && Boolean(errors.timeSendMessage)}
                                                                            helperText={touched.timeSendMessage && errors.timeSendMessage}
                                                                            className={classes.textField}
                                                                        />segundos antes de enviar a mensagem
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
                                                                        <CustomToolTip
                                                                            title=""
                                                                            content="Se houver uma mensagem escrita no campo, e uma midia for anexada, a mensagem será excluída."
                                                                        >
                                                                            <HelpOutlineOutlinedIcon
                                                                                color="primary"
                                                                                style={{ marginLeft: "14px" }}
                                                                                fontSize="small"
                                                                            />
                                                                        </CustomToolTip>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {values.messages[index].mediaUrl !== null && (
                                                                <Paper elevation={0} square className={classes.viewMediaInputWrapper}>
                                                                    <IconButton
                                                                        aria-label="cancel-upload"
                                                                        component="span"
                                                                        onClick={() => {
                                                                            values.messages[index].mediaUrl = null;
                                                                            handleEditRemovedMedia(values);
                                                                        }}
                                                                    >
                                                                        <CancelIcon className={classes.sendMessageIcons} />
                                                                    </IconButton>
                                                                    {loading ? (
                                                                        <div>
                                                                            <CircularProgress className={classes.circleLoading} />
                                                                        </div>
                                                                    ) : (
                                                                        <span>
                                                                            {values.messages[index].mediaUrl}
                                                                        </span>
                                                                    )}
                                                                </Paper>
                                                            )}
                                                            <Field
                                                                xs={9} key={`${index}-msg`}
                                                                as={TextField}
                                                                disabled={values.messages[index].mediaUrl || values.shortcode === ""}
                                                                name={`messages[${index}].message`}
                                                                rows={6}
                                                                label={i18n.t("quickMessages.dialog.message")}
                                                                multiline={true}
                                                                error={touched.messages && Boolean(errors.messages)}
                                                                helperText={touched.messages && errors.messages}
                                                                variant="outlined"
                                                                recording={recording}
                                                                inputProps={{ maxLength: 1024 }}
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
                                                                        <IconButton className={classes.addIcon}
                                                                            width={200}
                                                                            size="small"
                                                                            color="default"
                                                                            onClick={() => {
                                                                                setModalAnexoOpen(true)
                                                                                posicao = index;
                                                                            }}
                                                                        >
                                                                            <Add />
                                                                        </IconButton>),
                                                                }}
                                                            />
                                                            <Modal
                                                                open={modalAnexoOpen}
                                                                onClose={() => setModalAnexoOpen(false)}
                                                                name={`messages[${index}].midiaUrl`}
                                                                aria-labelledby="modal-modal-title"
                                                                aria-describedby="modal-modal-description"
                                                                disabled={values.shortcode === ""}
                                                            >
                                                                <Box className={classes.modalAnexo} >
                                                                    <FileInput
                                                                        handleChangeMedias={async (e) => {
                                                                            values.messages[posicao].mediaUrl = e.target.files[0];
                                                                            values.messages[posicao].message = null;
                                                                            handleEditRemovedMedia(values);
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
                                                                            values.messages[posicao].mediaUrl = file;
                                                                            handleEditRemovedMedia(values);
                                                                            setModalAnexoOpen(false);
                                                                        }}
                                                                        handleStartRecording={handleStartRecording}
                                                                    />
                                                                </Box>
                                                            </Modal>

                                                            <IconButton
                                                                mt={5}
                                                                size="small"
                                                                onClick={() => {
                                                                    if (!values.messages[1]) {
                                                                        values.lestMessage = true;
                                                                        handleEditRemovedMedia(values);
                                                                    } else {
                                                                        remove(index);
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteOutlineIcon />
                                                            </IconButton>
                                                        </Grid>
                                                    ))}

                                                    <Button color="primary"
                                                        className={classes.addButton} onClick={() => {
                                                            push({ message: "", mediaUrl: null, timeSendMessage: 3 })
                                                        }}>
                                                        Adicionar
                                                    </Button>
                                                </>
                                            )}
                                        </FieldArray>
                                    </Grid>
                                </DialogContent>
                                <Grid>
                                    <Field
                                        as={TextField}
                                        label={i18n.t("quickMessages.dialog.color")}
                                        name="color"
                                        id="color"
                                        onClick={() => {
                                            setColorPickerMessageOpen(true);// comentei a linha de baixo de codigo e mudei o onfocus pra onclick
                                            //greetingRef.current.focus();
                                        }}
                                        disabled={values.shortcode === ""}
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
                                                    onClick={() => setColorPickerMessageOpen(true)}
                                                >
                                                    <Colorize />
                                                </IconButton>
                                            ),
                                        }}
                                        variant="outlined"
                                        margin="dense"
                                    />
                                    <ColorPicker
                                        open={colorPickerMessageOpen}
                                        handleClose={() => setColorPickerMessageOpen(false)}
                                        onChange={(color) => {
                                            values.color = color;
                                            setMessages(() => {
                                                return { ...values, color };
                                            });
                                        }}
                                    />
                                    <div className={classes.select}>
                                        <QuickMessagesSelect
                                            selectedModules={selectedModules}
                                            onChange={values => {
                                                setSelectedModules(values);
                                            }}
                                        />
                                    </div>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancelar
                            </Button>
                            <ButtonWithSpinner style={{ marginRight: '20px' }} loading={loading} color="primary" type="submit" variant="contained" autoFocus>
                                Salvar
                            </ButtonWithSpinner>
                        </DialogActions>
                    </Form>
                )
                }
            </Formik >
        </Dialog >
    )
}

QuickMessageDialog.propType = {
    modalOpen: PropType.bool,
    onClose: PropType.func
}

export default QuickMessageDialog;