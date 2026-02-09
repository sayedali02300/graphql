import { renderLogin } from './application/login.js'; 
import { renderDashboard, updateUI } from './application/dashboard.js'; 
import { getGraphQLData } from './application/helpers/graphql.js';

const app = document.getElementById('app');
let fullData = null;

window.addEventListener('DOMContentLoaded', async () => {
    const savedToken = localStorage.getItem('token');
    
    if (savedToken) {
        // --- AUTHENTICATED STATE ---
        const cachedData = localStorage.getItem('user_data');
        
        // A. Instant Load (Cache)
        if (cachedData) {
            fullData = JSON.parse(cachedData);
            renderDashboard(fullData, handleLogout); 
            updateUI(fullData);        
        }

        // B. Background Update (Network)
        try {
            const data = await getGraphQLData(savedToken);
            if (data) {
                fullData = data;
                localStorage.setItem('user_data', JSON.stringify(data));
                
                // If we didn't have cache, build the dashboard now
                if (!cachedData) {
                    renderDashboard(data, handleLogout);
                }
                
                updateUI(data);
            } else {
                throw new Error("Invalid Token");
            }
        } catch (e) {
            console.error("Session invalid:", e);
            if (cachedData) {
                return; 
            }
            handleLogout();
        }
    } else {
        // --- LOGGED OUT STATE ---
        renderLogin(handleLoginSuccess);
    }
});

// 3. HANDLERS
function handleLoginSuccess(data) {
    fullData = data;
    renderDashboard(data, handleLogout);
    updateUI(data);
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    app.innerHTML = '';
    renderLogin(handleLoginSuccess);
}