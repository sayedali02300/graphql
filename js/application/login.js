import { login } from './helpers/auth.js';
import { getGraphQLData } from './helpers/graphql.js';

export function renderLogin(onLoginSuccess) {
    document.getElementById("app").innerHTML = `
        <div id="login-section" class="container">
            <h1 class="studentH1">Student Login</h1>
            <form id="login-form">
                <p id="error-msg" class="hidden">Invalid Credentials</p>
                <input type="text" id="username-input" placeholder="Username or Email" required>
                <input type="password" id="password-input" placeholder="Password" required>
                <button type="submit">Log In</button>
            </form>
        </div>
    `;

    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');
    const usernameInput = document.getElementById("username-input");
    const passwordInput = document.getElementById("password-input");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (loginForm.dataset.loggingIn === "true") return;
        loginForm.dataset.loggingIn = "true";

        const user = usernameInput.value;
        const pass = passwordInput.value;

        errorMsg.classList.add("hidden");
        errorMsg.textContent = "";

        // Spinner
        const slowTimer = setTimeout(() => {
            errorMsg.classList.remove("hidden");
            errorMsg.innerHTML = `<div class="loading-container"><div class="spinner"></div><span>Connecting...</span></div>`;
        }, 500);

        try {
            const loginTask = async () => {
                const token = await login(user, pass);
                const finalToken = typeof token === 'string' ? token : token.token;
                localStorage.setItem('token', finalToken);
                
                const data = await getGraphQLData(finalToken);
                if (!data) throw new Error("Could not fetch profile data.");
                return data;
            };

            const timeoutTask = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Connection timed out.")), 10000);
            });

            const data = await Promise.race([loginTask(), timeoutTask]);

            clearTimeout(slowTimer);
            localStorage.setItem('user_data', JSON.stringify(data));

            if (onLoginSuccess) onLoginSuccess(data);

        } catch (error) {
            clearTimeout(slowTimer);
            errorMsg.classList.remove("hidden");
            errorMsg.textContent = error.message;
            loginForm.dataset.loggingIn = "false";
        }
    });
}