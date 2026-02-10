import { renderLogin } from './application/login.js'; 
import { renderDashboard } from './application/dashboard.js'; 
import { getGraphQLData } from './application/helpers/graphql.js';

const app = document.getElementById('app');
let fullData = null;

window.addEventListener('DOMContentLoaded', async () => {
    const savedToken = localStorage.getItem('token');
    
    if (savedToken) {
        // B. Background Update (Network)
        try {
            const data = await getGraphQLData(savedToken);

            // success
                fullData = data;
                
                // render with fresh data
                renderDashboard(data, handleLogout);

        } catch (e) {
            console.error("Data Load Error:", e.message);

            if (e.message === "AUTH_ERROR") {
                handleLogout();
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));

                alert("Network Error: Could not load data. Please refresh the page.");
            }
        }
    } else {
        // --- LOGGED OUT STATE ---
        // i put the parameter inside the renderLogin
        renderLogin(handleLoginSuccess);
    }
});

// 3. HANDLERS
function handleLoginSuccess(data) {
    fullData = data;
    renderDashboard(data, handleLogout);
}

function handleLogout() {
    localStorage.removeItem('token');
    app.innerHTML = '';
    renderLogin(handleLoginSuccess);
}