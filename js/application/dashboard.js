import { createAuditGraph, createXPGraph, filterTransactionsByRange } from './helpers/graphs.js';
import { renderProjects } from './tabs/project.js';
import { renderSkills } from './tabs/skills.js';
import { renderProfile } from './tabs/profile.js';

// 4. DASHBOARD BUILDER (Creates the HTML structure)
export function renderDashboard(data, onLogout) {
    const app = document.getElementById('app');

    // 1. FIXED HTML STRUCTURE (Removed the "hidden" wrapper)
    app.innerHTML = `
        <div id="dashboard-layout">
            <div class="container">
                <header>
                    <h2 id="welcome-msg">&nbsp;</h2>
                    <button id="logout-btn" class="logout-btn">Log Out</button>
                </header>
                
                <div class="tabs">
                    <button class="tab-btn active" onclick="switchTab('profile', event)">Profile</button>
                    <button class="tab-btn" onclick="switchTab('skills', event)">Skills</button>
                    <button class="tab-btn" onclick="switchTab('projects', event)">Activities</button>
                    <button class="tab-btn" onclick="switchTab('graphs', event)">Graphs</button>
                </div>

                <div id="tab-profile" class="tab-content">
                    <div id="profile-grid" class="stats-grid"></div> 
                </div>

                <div id="tab-skills" class="tab-content hidden">
                    <div class="card">
                        <h3>Top Technical Skills</h3>
                        <p>Based on your piscine and project transactions.</p>
                        <div id="skills-container"></div>
                    </div>
                </div>

                <div id="tab-projects" class="tab-content hidden">
                    <div class="card">
                        <h3>Activities history</h3>
                        <p>Your last activities.</p>
                        <ul id="projects-container"></ul>
                    </div>
                </div>

                <div id="tab-graphs" class="tab-content hidden">
                    <div class="card" style="margin-bottom: 20px;">
                        <div class="progressAndWhenStart">
                            <h3 style="margin: 0;">XP Progression</h3>
                            <select id="xp-range-select">
                                <option value="all">Since the start</option>
                                <option value="6months">Last 6 months</option>
                                <option value="3months">Last 3 months</option>
                                <option value="1month">Last month</option>
                                <option value="1week">Last week</option>
                            </select>
                        </div>
                        <div id="xp-chart-container" class="chart-container"></div>
                        <div>
                            <strong>About this Graph:</strong> This chart visualizes your learning velocity. 
                        </div>
                    </div>

                    <div class="card">
                        <h3>Audit Ratio (Done vs Received)</h3>
                        <div id="audit-chart-container" class="chart-container"></div>
                        <div>
                            <strong>About this Graph:</strong> Ratio should be above 1.0.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', onLogout);
    }

    const rangeSelect = document.getElementById('xp-range-select');
    if (rangeSelect) {
        rangeSelect.addEventListener('change', (e) => {
            if (data && data.transaction) {
                const filtered = filterTransactionsByRange(data.transaction, e.target.value);
                const xpContainer = document.getElementById('xp-chart-container');
                if (xpContainer) {
                    xpContainer.innerHTML = ''; 
                    xpContainer.appendChild(createXPGraph(filtered));
                }
            }
        });
    }
}

// 5. UI UPDATER
export function updateUI(data) {
    if (!data || !data.user || !data.user[0]) return;
    const userData = data.user[0];
    
    // Welcome Message
    const welcomeMsg = document.getElementById('welcome-msg');
    if(welcomeMsg) welcomeMsg.innerText = `Welcome, ${userData.login}`;

    // Render Sub-Components
    try {
        renderProfile(data, userData);
        renderSkills(data);
        renderProjects(data);
        
        // Graphs
        const auditContainer = document.getElementById('audit-chart-container');
        if (auditContainer) auditContainer.innerHTML = createAuditGraph(userData);
        
        const xpContainer = document.getElementById('xp-chart-container');
        if (xpContainer) {
            xpContainer.innerHTML = '';
            xpContainer.appendChild(createXPGraph(data.transaction));
        }
    } catch (e) {
        console.error("Error rendering components:", e);
    }
}

// 6. Global Tab Switcher
window.switchTab = function(tabName, e) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) selectedTab.classList.remove('hidden');

    if (e && e.currentTarget) {
        e.currentTarget.classList.add('active');
    }
};