import { toast } from "react-toastify";
import { i18n } from "../translate/i18n";
import { isString } from 'lodash';

toast.configure();

const toastError = err => {
	const errorMsg = err.response?.data?.error;
	if (errorMsg) {
		if (i18n.exists(`backendErrors.${errorMsg}`)) {
			toast.error(i18n.t(`backendErrors.${errorMsg}`), {
				toastId: errorMsg,
			});
			return
		} else {
			toast.error(errorMsg, {
				toastId: errorMsg,
			});
			return
		}
	} if (isString(err)) {
		toast.error(err);
		return
	} else {
		console.log("An error occurred!");
		return
	}
};

export default toastError;
