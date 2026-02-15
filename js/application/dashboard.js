import { createAuditGraph, createXPGraph, filterTransactionsByRange } from './helpers/graphs.js';
import { renderProjects } from './tabs/project.js';
import { renderSkills } from './tabs/skills.js';
import { renderProfile } from './tabs/profile.js';

// Holds data to be used when switching tabs
let dashboardData = null;

// 1. DASHBOARD BUILDER
export function renderDashboard(data, onLogout) {
    dashboardData = data;
    const app = document.getElementById('app');
    console.log("USER TAB" + JSON.stringify(data.user[0], null, 2))
    // 1. FIXED HTML STRUCTURE (Only the shell, no tab content yet)
    app.innerHTML = `
        <div id="dashboard-layout">
            <div class="container">
                <header>
                    <h2 id="welcome-msg">Welcome, ${data.user[0].login}</h2>
                    <button id="logout-btn" class="logout-btn">Log Out</button>
                </header>
                
                <div class="tabs">
                    <button class="tab-btn active" data-tab="profile">Profile</button>
                    <button class="tab-btn" data-tab="skills">Skills</button>
                    <button class="tab-btn" data-tab="projects">Activities</button>
                    <button class="tab-btn" data-tab="graphs">Graphs</button>
                </div>

                <div id="dynamic-tab-content" class="tab-content">
                    </div>
            </div>
        </div>
    `;

    // 2. ATTACH LISTENERS
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', onLogout);

    // Tab Switching
    const tabContainer = document.querySelector('.tabs');
    tabContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            // Update Active Class
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Switch Content
            const selectedTab = e.target.getAttribute('data-tab');
            renderTabContent(selectedTab);
        }
    });

    // 3. INITIAL RENDER
    renderTabContent('profile');
}

// 2. DYNAMIC CONTENT RENDERER
function renderTabContent(tabName) {
    const container = document.getElementById('dynamic-tab-content');
    if (!container || !dashboardData) return;

    // Clear previous content
    container.innerHTML = '';

    const userData = dashboardData.user[0];

    switch (tabName) {
        case 'profile':
            // Inject Structure
            container.innerHTML = `<div id="profile-grid" class="stats-grid"></div>`;
            // Call Imported Renderer
            renderProfile(dashboardData, userData);
            break;

        case 'skills':
            container.innerHTML = `
                <div class="card">
                    <h3>Top Technical Skills</h3>
                    <p>Based on your piscine and project transactions.</p>
                    <div id="skills-container"></div>
                </div>`;
            renderSkills(dashboardData);
            break;

        case 'projects':
            container.innerHTML = `
                <div class="card">
                    <h3>Activities history</h3>
                    <ul id="projects-container"></ul>
                </div>`;
            renderProjects(dashboardData);
            break;

        case 'graphs':
            renderGraphsTab(container, userData);
            break;
    }
}

// 3. HELPER FOR GRAPH TAB
function renderGraphsTab(container, userData) {
    container.innerHTML = `
        <div class="card">
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
    `;

    // Render XP Graph
    const xpContainer = document.getElementById('xp-chart-container');
    if (xpContainer) {
        xpContainer.appendChild(createXPGraph(dashboardData.transaction));
    }

    // Render Audit Graph
    const auditContainer = document.getElementById('audit-chart-container');
    if (auditContainer) {
        auditContainer.innerHTML = createAuditGraph(userData);
    }

    // Re-attach Event Listener for Range Select
    // (Must be done here because the element is recreated every time we switch to this tab)
    const rangeSelect = document.getElementById('xp-range-select');
    if (rangeSelect) {
        rangeSelect.addEventListener('change', (e) => {
            const filtered = filterTransactionsByRange(dashboardData.transaction, e.target.value);
            xpContainer.innerHTML = ''; 
            xpContainer.appendChild(createXPGraph(filtered));
        });
    }
}
