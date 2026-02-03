import { login } from './application/auth.js';
import { getGraphQLData } from './application/graphql.js';
import {createAuditGraph, createXPGraph, filterTransactionsByRange } from './application/graphs.js';
import {renderProjects} from './application/tabs/project.js'
import {renderSkills} from './application/tabs/skills.js'
import {renderProfile} from './application/tabs/profile.js'

const loginForm = document.getElementById('login-form');
const loginSec = document.getElementById('login-section');
const profileSec = document.getElementById('profile-section');
const errorMsg = document.getElementById('error-msg');

let fullData = null; // Store the complete data globally

// 1. INSTANT LOAD & CACHE
window.addEventListener('DOMContentLoaded', async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        const cachedData = localStorage.getItem('user_data');
        if (cachedData) {
            console.log(cachedData)
            fullData = JSON.parse(cachedData);
            updateUI(fullData);
            profileSec.classList.remove("hidden");
            profileSec.style.display = ''; 
        }
        
        const data = await getGraphQLData(savedToken);
        if (data) {
            fullData = data;
            updateUI(data);
            localStorage.setItem('user_data', JSON.stringify(data));
            profileSec.classList.remove("hidden");
            profileSec.style.display = ''; 
        } else {
            if(!cachedData) {
                loginSec.classList.remove('hidden');
                localStorage.removeItem('token');
            }
        }
    } else {
        loginSec.classList.remove('hidden');
    }
});

// 2. LOGIN LOGIC
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (loginForm.dataset.loggingIn === "true") return;
    
    const user = document.getElementById("username-input").value;
    const pass = document.getElementById('password-input').value;
    const submitBtn = loginForm.querySelector('button');
    const CONNECTION_TIMEOUT_MS = 10000; // 10 Seconds Timeout Limit

    // UI Reset
    errorMsg.classList.add("hidden");
    errorMsg.textContent = "";
    errorMsg.style.color = ""; 
    errorMsg.style.backgroundColor = "";
    loginForm.dataset.loggingIn = "true";

    // Show "Connecting..." spinner only if it takes more than 500ms (UX polish)
    const slowTimer = setTimeout(() => {
        errorMsg.classList.remove("hidden");
        errorMsg.style.color = "#555"; 
        errorMsg.style.backgroundColor = "transparent";
        errorMsg.innerHTML = `<div class="loading-container"><div class="spinner"></div><span>Connecting...</span></div>`;
        errorMsg.style.border = "none"
    }, 500);

    try {
        // 1. Define the actual login task
        const loginTask = async () => {
            const token = await login(user, pass);
            localStorage.setItem('token', token);
            const data = await getGraphQLData(token);
            if (!data) throw new Error("Could not fetch profile data.");
            return data;
        };

        // 2. Define the timeout task (Rejects after 10 seconds)
        const timeoutTask = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Connection timed out. Server took too long to respond."));
            }, CONNECTION_TIMEOUT_MS);
        });

        // 3. Race them! Whichever happens first determines the result.
        const data = await Promise.race([loginTask(), timeoutTask]);

        // --- SUCCESS PATH ---
        clearTimeout(slowTimer); // Clear the spinner timer
        fullData = data;
        localStorage.setItem('user_data', JSON.stringify(data));
        updateUI(data);

        loginSec.classList.add('hidden');
        profileSec.classList.remove("hidden");
        profileSec.style.display = '';
        resetLoginState(submitBtn);

    } catch (error) {
        // --- ERROR / TIMEOUT PATH ---
        clearTimeout(slowTimer); // Stop the spinner timer if it's running
        
        errorMsg.classList.remove("hidden");
        errorMsg.style.color = ""; 
        errorMsg.style.backgroundColor = "";
        // This will now print "Connection timed out..." if the timer won
        errorMsg.textContent = error.message; 
        
        loginSec.classList.remove('hidden');
        resetLoginState(submitBtn);
    }
});

// 3. UI BUILDER
function updateUI(data) {
    const userData = data.user[0];
    
    const welcomeMsg = document.getElementById('welcome-msg');
    if(welcomeMsg) welcomeMsg.innerText = `Welcome, ${userData.login}`;

    // --- Profile---
    const profileGrid = document.getElementById('profile-grid');
    try {
        renderProfile(data, userData);
    } catch (e) {
        console.error("Profile Error:", e);
        if(profileGrid) {
            profileGrid.innerHTML = `<p class="error-text">Error occurred while rendering profile</p>`;
        }
    }
    // ---SKILLS ---
    const skillsContainer = document.getElementById('skills-container');
    try {
        renderSkills(data);
    } catch (e) {
        console.error("Skills Error:", e);
        if(skillsContainer) {
            skillsContainer.innerHTML = `<p class="error-text">Error occurred while loading skills</p>`;
        }
    }
    // TAB 3
   const projectsContainer = document.getElementById('projects-container');
    try {
        renderProjects(data);
    } catch (e) {
        console.error("Projects Error:", e);
        if(projectsContainer) {
            projectsContainer.innerHTML = `<p class="error-text">Error occurred while loading projects</p>`;
        }
    }
    // TAB 4 -- GRAPHS
    try {
        const auditContainer = document.getElementById('audit-chart-container');
        const xpContainer = document.getElementById('xp-chart-container');
        
        // Audit Graph returns a String, so innerHTML is correct ✅
        if (auditContainer) auditContainer.innerHTML = createAuditGraph(userData);
        
        // XP Graph returns a DOM Element, so we must use appendChild ⚠️
        if (xpContainer) {
            xpContainer.innerHTML = ''; // Clear previous graph
            xpContainer.appendChild(createXPGraph(data.transaction)); // Append the new Element
        }
    } catch(e) { 
        console.warn("Graph error", e); 
}
}
// XP Range selector handler
window.addEventListener('DOMContentLoaded', () => {
    const rangeSelect = document.getElementById('xp-range-select');
    if (rangeSelect) {
        rangeSelect.addEventListener('change', (e) => {
            if (fullData && fullData.transaction) {
                const filtered = filterTransactionsByRange(fullData.transaction, e.target.value);
                const xpContainer = document.getElementById('xp-chart-container');
                
                if (xpContainer) {
                    xpContainer.innerHTML = ''; // Clear old graph
                    xpContainer.appendChild(createXPGraph(filtered)); // Append new graph
                }
            }
        });
    }
});

// Helpers
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    location.reload(); 
});

// TAB SWITCHER
window.switchTab = function(tabName) {
    document.getElementById('tab-profile').classList.add('hidden');
    document.getElementById('tab-skills').classList.add('hidden');
    document.getElementById('tab-projects').classList.add('hidden');
    document.getElementById('tab-graphs').classList.add('hidden');

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) selectedTab.classList.remove('hidden');

    const activeBtn = Array.from(buttons).find(btn => btn.getAttribute('onclick').includes(tabName));
    if (activeBtn) activeBtn.classList.add('active');
};

function resetLoginState(btn) {
    const form = document.getElementById('login-form');
    form.dataset.loggingIn = "false";
}