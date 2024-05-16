import React, { useState } from "react";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { Checkbox, Divider, ListItemText } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

const TicketsQueueSelect = ({
	userQueues,
	selectedQueueIds = [],
	onChange,
}) => {
	const [selectAll, setSelectAll] = useState(true);

	const handleChange = (e) => {
		const value = e.target.value;
		if (value.includes("TODOS") || selectAll) {
			setSelectAll(!selectAll);
			if (!selectAll) {
				onChange(userQueues.map(queue => queue.id));
			} else if (value.includes("TODOS")) {
				let indice = value.indexOf("TODOS");
				value.splice(indice, 1);
				onChange(value);
			} else {
				onChange([]);
				setSelectAll(false);
			}
		} else {
			onChange(value);
			setSelectAll(value.length === userQueues.length);
		}
	};

	return (
		<div style={{ width: 120, marginTop: -4 }}>
			<FormControl fullWidth margin="dense">
				<Select
					multiple
					displayEmpty
					variant="outlined"
					value={selectAll ? ["TODOS", ...userQueues.map(queue => queue.id)] : selectedQueueIds}
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
					renderValue={() => i18n.t("ticketsQueueSelect.placeholder")}
				>
					<MenuItem dense key="TODOS" value="TODOS">
						<Checkbox size="small" color="primary" checked={selectAll} />
						<ListItemText primary="Marcar Todos" />
					</MenuItem>
					<Divider />
					{userQueues?.length > 0 &&
						userQueues.map((queue) => (
							<MenuItem dense key={queue.id} value={queue.id}>
								<Checkbox
									style={{
										color: queue.color,
									}}
									size="small"
									color="primary"
									checked={selectedQueueIds.includes(queue.id)}
								/>
								<ListItemText primary={queue.name} />
							</MenuItem>
						))}
				</Select>
			</FormControl>
		</div>
	);
};

export default TicketsQueueSelect;