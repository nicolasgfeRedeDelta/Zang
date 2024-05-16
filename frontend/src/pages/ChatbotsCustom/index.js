import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";

import ChatbotsManagerTabs from "../../components/ChatbotManagerTabs";

const useStyles = makeStyles(theme => ({
	chatContainer: {
		flex: 1,
		backgroundColor: "#eee",
		padding: theme.spacing(10),
		height: `calc(100% - 48px)`,
		overflowY: "hidden",
	},

	chatPapper: {
		display: "flex",
		flexDirection: "row",
		height: "100%",
		width: "100%",
		justifyContent: "center"
	},

	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
		width:"100%"
	},
}));

const ChatbotsCustom = () => {
	const classes = useStyles();

	return (
		<div className={classes.chatContainer}>
			<div className={classes.chatPapper}>
				<Grid spacing={0}>
					<Grid spacing={0} className={classes.contactsWrapper}>
						<ChatbotsManagerTabs />
					</Grid >
				</Grid>
			</div>
		</div>
	);
};

export default ChatbotsCustom;