import { createAuditGraph, createXPGraph } from '../graphs.js';

export function renderProjects(data) {
    if (!data || !data.transaction) return;
    
    const allTransactions = data.transaction;
    console.log("TRANSICTIONS ->", allTransactions)
    const levelTransactions = allTransactions.filter(tx => tx.type === 'level');
    const currentLevel = levelTransactions.length > 0 
        ? Math.max(...levelTransactions.map(tx => tx.amount)) 
        : 0;

    const xpTransactions = allTransactions.filter(tx => tx.type === 'xp');
    const totalXPBytes = xpTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalXPDisplay = (totalXPBytes / 1000).toFixed(1);

    const statsHeaderHTML = `
    <div class="stats-grid">
        <div class="stat-card level-card">
            <div class="stat-label">Level</div>
            <div class="stat-value">${currentLevel}</div>
        </div>
        <div class="stat-card xp-card">
            <div class="stat-label">Total XP</div>
            <div class="stat-value">${totalXPDisplay}<span class="stat-unit">kB</span></div>
        </div>
        <div class="stat-card projects-card">
            <div class="stat-label">Projects</div>
            <div class="stat-value">${xpTransactions.length}</div>
        </div>
    </div>
    `;

    const projectsListHTML = xpTransactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(tx => {
            const date = new Date(tx.createdAt).toLocaleDateString('en-GB', { 
                day: 'numeric', month: 'short', year: 'numeric' 
            });

            const xpAmount = (tx.amount / 1000).toFixed(2);
            const rawName = tx.path.split('/').pop();
            const name = rawName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            return `
                <li>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; color: #fff;">${name}</span>
                        <span style="font-size: 0.8em; color: rgba(255,255,255,0.5);">${date}</span>
                    </div>
                    <span style="font-weight: bold; color: ${tx.amount > 0 ? "#4af847": "#f52929"}; font-family: monospace; font-size: 1.1em;">
                        ${tx.amount > 0 ? "+": ""} ${xpAmount} kB
                    </span>
                </li>
            `;
        }).join('');

    const projectsContainer = document.getElementById('projects-container');
    if(projectsContainer) {
        projectsContainer.innerHTML = statsHeaderHTML + 
            `<ul style="list-style: none; padding: 0; margin: 0;">${projectsListHTML || "<li style='text-align:center; color:#888'>No XP transactions found.</li>"}</ul>`;
    }

    try {
        const auditContainer = document.getElementById('audit-chart-container');
        const xpContainer = document.getElementById('xp-chart-container');
        
        if (auditContainer && window.userData) {
            auditContainer.innerHTML = createAuditGraph(window.userData);
        }
        
        if (xpContainer) {
            xpContainer.innerHTML = ''; 
            xpContainer.appendChild(createXPGraph(data.transaction)); 
        }
    } catch(e) { 
        console.warn("Graph error:", e); 
    }
}