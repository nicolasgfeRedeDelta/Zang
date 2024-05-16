import React, { useState, useEffect } from "react";
import { isString } from "lodash";
import PropTypes from "prop-types";
import {
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
    makeStyles
} from '@material-ui/core';
import {
    Edit as EditIcon,
    DeleteOutline as DeleteOutlineIcon
} from "@material-ui/icons";

import TableRowSkeleton from "../../components/TableRowSkeleton";

const useStyles = makeStyles((theme) => ({
    mainPaper: {
        flex: 1,
        padding: theme.spacing(1),
        overflowY: "scroll",
        ...theme.scrollbarStyles,
    },
    customTableCell: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
}));
function QuickMessagesTable(props) {
    const classes = useStyles();

    const { messages, showLoading, editMessage, deleteMessage, readOnly } = props
    const [loading, setLoading] = useState(true)
    const [rows, setRows] = useState([])

    useEffect(() => {
        if (Array.isArray(messages)) {
            setRows(messages)
        }
        if (showLoading !== undefined) {
            setLoading(showLoading)
        }
    }, [messages, showLoading])

    const handleEdit = (message) => {
        editMessage(message)
    }

    const handleDelete = (message) => {
        deleteMessage(message)
    }

    const renderRows = () => {
        return rows.map((message) => {
            let truncatedShortcode = message.shortcode
            let truncatedMessage = message.messages[0].message === "" ? message.messages[0].mediaUrl : message.messages[0].message;
            if (isString(truncatedMessage) && truncatedMessage.length > 35) {
                truncatedMessage = message.messages[0].message.substring(0, 35) + "..."; // implenentei isso pois na hora de exibir as mensagens e era mto grande ele zoava o css de todas as linhas
            }
            if (isString(truncatedShortcode) && truncatedShortcode.length > 15) {
                truncatedShortcode = message.shortcode.substring(0, 15) + "...";
            }
            return (
                <TableRow key={message.id}>
                    <TableCell align="center">{truncatedShortcode}</TableCell>
                    <TableCell align="left">{truncatedMessage}</TableCell>
                    <TableCell align="center">
                        <div className={classes.customTableCell}>
                            <span
                                style={{
                                    backgroundColor: message.color,
                                    width: 60,
                                    height: 20,
                                    alignSelf: "center",
                                }}
                            />
                        </div>
                    </TableCell>
                    {!readOnly ? (
                        <TableCell align="center">
                            <IconButton
                                size="small"
                                onClick={() => handleEdit(message)}
                            >
                                <EditIcon />
                            </IconButton>

                            <IconButton
                                size="small"
                                onClick={() => handleDelete(message)}
                            >
                                <DeleteOutlineIcon />
                            </IconButton>
                        </TableCell>
                    ) : null}
                </TableRow>
            )
        })
    }

    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell align="center">Atalho</TableCell>
                    <TableCell align="left">Mensagem</TableCell>
                    <TableCell align="center">Cor</TableCell>
                    {!readOnly ? (
                        <TableCell align="center">Ações</TableCell>
                    ) : null}
                </TableRow>
            </TableHead>
            <TableBody>
                {loading ? <TableRowSkeleton columns={readOnly ? 2 : 3} /> : renderRows()}
            </TableBody>
        </Table>
    )
}

QuickMessagesTable.propTypes = {
    messages: PropTypes.array.isRequired,
    showLoading: PropTypes.bool,
    editMessage: PropTypes.func.isRequired,
    deleteMessage: PropTypes.func.isRequired
}

export default QuickMessagesTable;