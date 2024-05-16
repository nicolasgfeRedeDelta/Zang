import React, { useState, useEffect, useContext } from "react";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import { makeStyles, Button, Paper } from "@material-ui/core";

import QuickMessagesTable from "../../components/QuickMessagesTable";
import QuickMessageDialog from "../../components/QuickMessageDialog";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import { toast } from "react-toastify";

import useQuickMessages from "../../hooks/useQuickMessages";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

function QuickMessages(props) {
  const classes = useStyles();
  const [messages, setMessages] = useState();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [messageSelected, setMessageSelected] = useState({});
  const [showOnDeleteDialog, setShowOnDeleteDialog] = useState(false);

  const {
    list: listMessages,
    save: saveMessage,
    update: updateMessage,
    deleteRecord: deleteMessage,
  } = useQuickMessages();

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      await loadingQuickMessages();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadingQuickMessages = async () => {
    setLoading(true);
    try {
      const companyId = localStorage.getItem("companyId");
      const messages = await listMessages({ companyId, userId: user.id });
      setMessages(messages);
    } catch (e) {
      toast.error(e);
    }
    setLoading(false);
  };

  const handleOpenToAdd = () => {
    setModalOpen(true);
  };

  const handleOpenToEdit = (message) => {
    setMessageSelected(message);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setMessageSelected({ id: null, color: "", message: "", shortcode: ""});
  };

  const handleSave = async (message) => {
    handleCloseModal();
    try {
      await saveMessage(await makeFormData(message));
      await loadingQuickMessages();
      toast.success("Messagem adicionada com sucesso.");
    } catch (e) {
      toast.error(e);
    }
  };

  const handleEdit = async (message) => {
    handleCloseModal();
    try {
      await updateMessage(await makeFormData(message));
      await loadingQuickMessages();
      toast.success("Messagem atualizada com sucesso.");
    } catch (e) {
      toast.error(e);
    }
  };

  const handleEditMessageRemoveMedia = async (message) => {
    if (message.lestMessage) {//esse if serve para quando o usuario clicar no icone de lixeira dentro do modal de mensagens rapidas, ele limpar o campo e abrir o modal na mesma mensagem novamente.
      message.lestMessage = false
      handleCloseModal();
      message.messages[0].mediaUrl = null;
      message.messages[0].message = null;
      await updateMessage(await makeFormData(message));
      await loadingQuickMessages();
      setMessageSelected(message);
      setModalOpen(true);
    } else {
      try {
        if (message.id) {
          await updateMessage(await makeFormData(message));
        } else {
          message.shortcode = undefined;
          await saveMessage(await makeFormData(message));
        }
        await loadingQuickMessages();
      } catch (e) {
        toast.error(e);
      }
    }
  };

  const makeFormData = async (message) => {
    const formData = new FormData();
    message.messages.map(async (msg) => {
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
    formData.append("recipe", JSON.stringify(message));
    return formData
  }
  
  const handleDelete = async (message) => {
    handleCloseModal();
    try {
      await deleteMessage(message.id);
      await loadingQuickMessages();
      toast.success("Messagem excluída com sucesso.");
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>{i18n.t("quickMessages.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Button variant="contained" color="primary" onClick={handleOpenToAdd}>
            {i18n.t("quickMessages.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <QuickMessagesTable
          readOnly={false}
          messages={messages}
          showLoading={loading}
          editMessage={handleOpenToEdit}
          deleteMessage={(message) => {
            setMessageSelected(message);
            setShowOnDeleteDialog(true);
          }}
        />
      </Paper>
      <QuickMessageDialog
        messageSelected={messageSelected}
        modalOpen={modalOpen}
        onClose={handleCloseModal}
        editMessage={handleEdit}
        saveMessage={handleSave}
        editMessageRemoveMedia={handleEditMessageRemoveMedia}
      />
      <ConfirmationModal
        title="Excluir Registro"
        open={showOnDeleteDialog}
        onClose={setShowOnDeleteDialog}
        onConfirm={async () => {
          await handleDelete(messageSelected);
        }}
      >
        Deseja realmente excluir este registro?
      </ConfirmationModal>
    </MainContainer>
  );
}

export default QuickMessages;
