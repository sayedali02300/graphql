import { login } from './helpers/auth.js';
import { getGraphQLData } from './helpers/graphql.js';

export function renderLogin(onLoginSuccess) {
    document.getElementById("app").innerHTML = `
        <div id="login-section" class="container">
            <h1 class="studentH1">Student Login</h1>
            <form id="login-form">
                <input type="text" id="username-input" placeholder="Username or Email" required>
                <input type="password" id="password-input" placeholder="Password" required>
                <button type="submit">Log In</button>
            </form>
        </div>
    `;
    const ErrorDiv = document.createElement("div");
    ErrorDiv.id = "error-msg";

    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById("username-input");
    const passwordInput = document.getElementById("password-input");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        ErrorDiv.remove();
        ErrorDiv.textContent = "";
        
        const user = usernameInput.value;
        const pass = passwordInput.value;

        // Spinner
        const slowTimer = setTimeout(() => {
            loginForm.prepend(ErrorDiv);
            ErrorDiv.innerHTML = `<div class="loading-container"><div class="spinner"></div><span>Connecting...</span></div>`;
        }, 500);

        try {
            const loginTask = async () => {
                const token = await login(user, pass);
                localStorage.setItem('token', token);
                
                const data = await getGraphQLData(token);
                if (!data) throw new Error("Could not fetch profile data.");
                return data;
            };

            const timeoutTask = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Connection timed out.")), 10000);
            });

            const data = await Promise.race([loginTask(), timeoutTask]);

            clearTimeout(slowTimer);

            if (onLoginSuccess) onLoginSuccess(data);

        } catch (error) {
            clearTimeout(slowTimer);
            loginForm.prepend(ErrorDiv);
            ErrorDiv.textContent = error.message;
        }
    });
}