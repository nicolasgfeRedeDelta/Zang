import React, { useState, useContext, useEffect } from "react";

import {
    TextField,
    InputAdornment,
    IconButton
} from '@material-ui/core';

import { Visibility, VisibilityOff } from '@material-ui/icons';

import '../../assets/style.css';

import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";

const Login = () => {
    const [user, setUser] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);

    const { handleLogin } = useContext(AuthContext);

    const handleChangeInput = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlSubmit = (e) => {
        // console.log(user)
        e.preventDefault();
        handleLogin(user);
    };

    return (
        <>
            <div className="login-content" style={{ justifyContent: "center"}}>
                <form noValidate onSubmit={handlSubmit}>
                    <img src="https://www.rededelta.com.br/static/media/delta.e0168203.svg" />
                    <TextField
                        variant="standard"
                        margin="normal"
                        color="warning"
                        required
                        fullWidth
                        id="email"
                        label={i18n.t("login.form.email")}
                        name="email"
                        value={user.email}
                        onChange={handleChangeInput}
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        variant="standard"
                        margin="normal"
                        color="success"
                        required
                        fullWidth
                        name="password"
                        label={i18n.t("login.form.password")}
                        id="password"
                        value={user.password}
                        onChange={handleChangeInput}
                        autoComplete="current-password"
                        type={showPassword ? 'text' : 'password'}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword((e) => !e)}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <input type="submit" className="btn" value="Acessar" />
                </form>
            </div>
        </>
    );
};

export default Login;
