import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field, isString } from "formik";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { FormControl } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import moment from "moment"
import { AuthContext } from "../../context/Auth/AuthContext";
import { isArray, capitalize } from "lodash";
import useQuickMessages from "../../hooks/useQuickMessages";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
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

	messageQuickAnswersWrapper: {
		margin: 0,
		position: "absolute",
		top: "48%",
		background: "#ffffff",
		padding: "2px",
		border: "1px solid #CCC",
		left: 0,
		width: "72%",
		left: "33px",
		"& li": {
			listStyle: "none",
			"& a": {
				textAlign: "left",
				display: "block",
				padding: "8px",
				textOverflow: "ellipsis",
				overflow: "hidden",
				maxHeight: "32px",
				"&:hover": {
					background: "#F1F1F1",
					cursor: "pointer",
				},
			},
		},
	},
}));

const ScheduleSchema = Yup.object().shape({
	body: Yup.string()
		.min(5, "Mensagem muito curta")
		.required("Obrigatório"),
	contactId: Yup.number().required("Obrigatório"),
	sendAt: Yup.string().required("Obrigatório"),
	whatsappId: Yup.string().required("Obrigatório")
});

let values
let selectedOption
const ScheduleModal = ({ open, onClose, scheduleId, contactId, whatsappId, cleanContact, reload }) => {
	const classes = useStyles();
	const history = useHistory();
	const { user } = useContext(AuthContext);
	const { list: listQuickMessages } = useQuickMessages();
	const [quickMessages, setQuickMessages] = useState([]);
	const [typeBar, setTypeBar] = useState(false);
	const [filteredMessages, setFilteredMessages] = useState(quickMessages);
	const [inputMessage, setInputMessage] = useState("");

	useEffect(() => {
		async function fetchData() {
			const companyId = localStorage.getItem("companyId");
			let messages = await listQuickMessages({ companyId, userId: user.id, modules: "Agendamentos" });

			if (messages[0] != null) {
				if (messages[0].messages.length > 1) {
					messages = [];
				} else if (messages[0].messages.length === 1) {
					if (messages[0].messages[0].mediaUrl != null) {
						messages = [];
					}
				}
			}

			const options = messages.map((m, index) => {
				let truncatedShortcode = m.shortcode
				let truncatedMessage = m.messages[0].message == "" ? m.messages[0].mediaUrl : m.messages[0].message;
				if (isString(truncatedMessage) && truncatedMessage.length > 30) {
					truncatedMessage = m.messages[0].message.substring(0, 30) + "...";
				}
				if (isString(truncatedShortcode) && truncatedShortcode.length > 15) {
					truncatedShortcode = m.shortcode.substring(0, 15) + "...";
				}
				if (messages != undefined) {
					values = messages
				}

				return {
					value: "",
					color: m.color,
					shortcode: truncatedShortcode,
					label: `/${m.shortcode}`,
					id: m.id,
					truncatedMessage: `${truncatedMessage}`,
				};
			});
			values != undefined &&
				values.map((msg, index) => {
					if (options.length > 0) {
						options[index].value = msg
					}
				})
			setQuickMessages(options);
		}
		fetchData();
	}, []);

	const initialState = {
		body: "",
		contactId: "",
		whatsappId: "",
		sendAt: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
		sentAt: ""
	};

	const initialContact = {
		id: "",
		name: ""
	}

	const initialWhatsapp = {
		id: "",
		name: ""
	}

	const [schedule, setSchedule] = useState(initialState);
	const [currentContact, setCurrentContact] = useState(initialContact);
	const [contacts, setContacts] = useState([initialContact]);
	const [currentWhatsapp, setCurrentWhatsapp] = useState(initialWhatsapp);
	const [whatsapps, setWhatsapps] = useState([initialWhatsapp]);

	useEffect(() => {
		if (contactId && contacts.length) {
			const contact = contacts.find(c => c.id === contactId);
			if (contact) {
				setCurrentContact(contact);
			}
		}
	}, [contactId, contacts]);

	useEffect(() => {
		const { companyId } = user;
		if (open) {
			try {
				(async () => {
					const { data: contactList } = await api.get('/contacts/list', { params: { companyId: companyId } });
					let customList = contactList.map((c) => ({ id: c.id, name: c.name }));
					if (isArray(customList)) {
						setContacts([{ id: "", name: "" }, ...customList]);
					}
					const { data: whatsappList } = await api.get('/whatsapp', { params: { companyId: companyId } });
					if (whatsappId) {
						const whatsappTicket = whatsappList.find((w) => w.id === whatsappId);
						setCurrentWhatsapp(whatsappTicket);
						setSchedule(prevState => {
							return { ...prevState, whatsappId: whatsappTicket.id }
						});
					} else {
						const whatsappDefault = whatsappList.find((w) => w.isDefault === true);
						const valueWhatsapp = whatsappDefault ?? initialWhatsapp;
						setCurrentWhatsapp(valueWhatsapp);
						setSchedule(prevState => {
							return { ...prevState, whatsappId: valueWhatsapp.id }
						});
					}
					setWhatsapps(whatsappList)
					if (contactId) {
						setSchedule(prevState => {
							return { ...prevState, contactId }
						});
					}

					if (!scheduleId) return;

					const { data } = await api.get(`/schedules/${scheduleId}`);
					setInputMessage(data.body);
					setSchedule(prevState => {
						return { ...prevState, ...data, sendAt: moment(data.sendAt).format('YYYY-MM-DDTHH:mm') };
					});
					setCurrentContact(data.contact);
				})()
			} catch (err) {
				toastError(err);
			}
		}
	}, [scheduleId, contactId, open, user]);

	const handleClose = () => {
		onClose();
		setTypeBar(false);
		setSchedule(initialState);
		setInputMessage("");
	};

	const formateSingleMessage = (opt) => {
		let singleMessageFormated
		if (opt != null) {
			if (opt.message != null && opt.mediaUrl === null) {
				singleMessageFormated = opt.message
			} else if (opt.mediaUrl != null && opt.message === null) {
				singleMessageFormated = opt.mediaUrl
			} else if (opt.mediaUrl != null && opt.message != null) {
				singleMessageFormated = `${opt.mediaUrl} \n${opt.message}`
			}
		}
		return singleMessageFormated
	}

	const handleQuickMessagesClick = (value) => {
		value.value.messages.map((opt) => {
			selectedOption = value
			setInputMessage(formateSingleMessage(opt));
		})
		setTypeBar(false);
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && typeBar && filteredMessages.length > 0) {
			handleQuickMessagesClick(filteredMessages[0]);
			setTypeBar(false);
		}
	};

	const handleChangeInput = (e, values) => {
		setInputMessage(e.target.value);
		handleLoadQuickMessages(e.target.value);
		filterMessage(e.target.value);
	};

	const handleLoadQuickMessages = async (value) => {
		if (value && value.indexOf("/") === 0) {
			try {
				if (quickMessages.length > 0) {
					setTypeBar(true);
				} else {
					setTypeBar(false);
				}
			} catch (err) {
				setTypeBar(false);
			}
		} else {
			setTypeBar(false);
		}
	};

	const filterMessage = (values) => {
		let valueFormated = values.slice(1);
		const filtered = quickMessages.filter((message) =>
			message.shortcode.trim().toLowerCase().includes(valueFormated.toLowerCase())
		);
		if (filtered.length === 0) {
			setTypeBar(false)
		} else {
			setFilteredMessages(filtered);
		}
	}

	const handleSaveSchedule = async values => {
		const scheduleData = { ...values, userId: user.id };
		try {
			if (scheduleId) {
				await api.put(`/schedules/${scheduleId}`, scheduleData);
			} else {
				await api.post("/schedules", scheduleData);
			}
			toast.success(i18n.t("scheduleModal.success"));
			if (typeof reload == 'function') {
				reload();
			}
			if (contactId) {
				if (typeof cleanContact === 'function') {
					cleanContact();
					history.push('/schedules');
				}
			}
		} catch (err) {
			toastError(err);
		}
		setCurrentContact(initialContact);
		setSchedule(initialState);
		setCurrentWhatsapp(initialWhatsapp);
		setWhatsapps(initialWhatsapp);
		handleClose();
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{schedule.status === 'ERRO' ? 'Erro de Envio' : `Mensagem ${capitalize(schedule.status)}`}
				</DialogTitle>
				<Formik
					initialValues={schedule}
					enableReinitialize={true}
					validationSchema={ScheduleSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveSchedule(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting, values }) => (
						<Form>
							<DialogContent dividers>
								<div className={classes.multFieldLine}>
									<FormControl
										variant="outlined"
										fullWidth
									>
										<Autocomplete
											fullWidth
											value={currentContact}
											options={contacts}
											onChange={(e, contact) => {
												const contactId = contact ? contact.id : '';
												setSchedule({ ...schedule, contactId });
												setCurrentContact(contact ? contact : initialContact);
											}}
											getOptionLabel={(option) => option.name}
											getOptionSelected={(option, value) => {
												return value.id === option.id
											}}
											renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Contato" />}
										/>
									</FormControl>
								</div>
								<br />
								<div className={classes.multFieldLine}>
									<FormControl
										variant="outlined"
										fullWidth
									>
										<Autocomplete
											fullWidth
											value={currentWhatsapp}
											options={whatsapps}
											onChange={(e, whatsapp) => {
												const whatsappId = whatsapp ? whatsapp.id : '';
												setSchedule({ ...schedule, whatsappId });
												setCurrentWhatsapp(whatsapp ? whatsapp : initialWhatsapp);
											}}
											getOptionLabel={(option) => option.name}
											getOptionSelected={(option, value) => {
												return value.id === option.id
											}}
											renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Conexão" />}
										/>
									</FormControl>
								</div>
								<br />
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										rows={9}
										multiline={true}
										label={i18n.t("scheduleModal.form.body")}
										name="body"
										error={touched.body && Boolean(errors.body)}
										helperText={touched.body && errors.body}
										variant="outlined"
										margin="dense"
										fullWidth
										onClick={values.body = inputMessage}
										onKeyDown={(e) => {
											handleKeyDown(e)
											if (e.shiftKey) return;
											else if (e.key === "Enter") {
												e.preventDefault()
												setTypeBar(false);
											}
										}}
										onChange={(e) => {
											handleChangeInput(e, values)
											values.body = inputMessage
										}}
										value={inputMessage}
									/>
									{typeBar ? (
										<ul
											className={classes.messageQuickAnswersWrapper}>
											{filteredMessages.map((value, index) => {
												return (
													<li
														className={classes.messageQuickAnswersWrapperItem}
														key={index}
													>
														{<a onClick={() => handleQuickMessagesClick(value)}>
															<text style={{ WebkitTextFillColor: value.color }}>
																{`${value.shortcode}`}</text> - {value.truncatedMessage}
														</a>}
													</li>
												);
											})}
										</ul>
									) : (
										<div></div>
									)}
								</div>
								<br />
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										label={i18n.t("scheduleModal.form.sendAt")}
										type="datetime-local"
										name="sendAt"
										InputLabelProps={{
											shrink: true,
										}}
										error={touched.sendAt && Boolean(errors.sendAt)}
										helperText={touched.sendAt && errors.sendAt}
										variant="outlined"
										fullWidth
									/>
								</div>
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("scheduleModal.buttons.cancel")}
								</Button>
								{(schedule.sentAt === null || schedule.sentAt === "") && (
									<Button
										type="submit"
										color="primary"
										disabled={isSubmitting}
										variant="contained"
										className={classes.btnWrapper}
									>
										{scheduleId
											? `${i18n.t("scheduleModal.buttons.okEdit")}`
											: `${i18n.t("scheduleModal.buttons.okAdd")}`}
										{isSubmitting && (
											<CircularProgress
												size={24}
												className={classes.buttonProgress}
											/>
										)}
									</Button>
								)}
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div>
	);
};

export default ScheduleModal;