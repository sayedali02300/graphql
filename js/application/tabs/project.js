export function renderProjects(data) {
    if (!data || !data.transaction) return;
    
    console.log("TRANSACTIONS" + JSON.stringify(data.transaction, null, 2));
    const allTransactions = data.transaction;

    const levelTransactions = allTransactions.filter(tx => tx.type === 'level');
    const currentLevel = levelTransactions.length > 0 
        ? Math.max(...levelTransactions.map(tx => tx.amount)) 
        : 0;

    const xpTransactions = allTransactions.filter(tx => tx.type === 'xp');
    const totalXPBytes = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalXPDisplay = (totalXPBytes / 1000).toFixed(2);

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

    // Build Grade Map
    const gradeMap = new Map();
    if(data.progress){
        data.progress.forEach(p => {
            const key = p.object.id;
            const currentGrade = p.grade === null ? 0 : p.grade;
            const existingGrade = gradeMap.get(key) || 0;

            if (currentGrade >= existingGrade || !gradeMap.has(key)) {
                gradeMap.set(key, currentGrade);
            }
        });
    }
    const displayedProjects = new Set();
    const projectsListHTML = xpTransactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(tx => {
            const date = new Date(tx.createdAt).toLocaleDateString('en-GB', { 
                day: 'numeric', month: 'short', year: 'numeric' 
            });

            const xpAmount = (tx.amount / 1000).toFixed(2);
            const rawName = tx.path.split('/').pop();
            console.log(rawName);
            const name = rawName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const lookupkey = tx.objectId;
            console.log(lookupkey)
            const grade = gradeMap.get(lookupkey);

            let showGrade = false;
            if (!displayedProjects.has(rawName)) {
                displayedProjects.add(rawName);
                showGrade = true;
            }
            const gradeHTML = (showGrade && grade !== undefined) ? 
                `<span class="grade"
                style="
                    background: ${grade >= 1 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 146, 60, 0.2)'}; 
                    color: ${grade >= 1 ? '#4ade80' : '#fb923c'};
                    border: 1px solid ${grade >= 1 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(251, 146, 60, 0.3)'};
                ">Grade: ${grade.toFixed(2)}</span>` 
                : '';
            return `

                <li>
                    <div style="display: flex; flex-direction: column;">
                          <span style="font-weight: 600; color: #fff; display: flex; align-items: center;">
                            ${name}
                            ${gradeHTML}
                        </span>
                        <span style="font-size: 0.8em; color: rgba(255,255,255,0.5);">${date}</span>
                    </div>
                    <span style="font-weight: bold; color: ${tx.amount > 0 ? "#4af847": "#f52929"}; font-family: monospace; font-size: 1.1em;">
                        ${tx.amount > 0 ? "+": ""}${xpAmount} kB
                    </span>
                </li>
            `;
        }).join('');

        const projectsContainer = document.getElementById('projects-container');
    if(projectsContainer) {
        projectsContainer.innerHTML = statsHeaderHTML + 
            `<h3 style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">Activity Log</h3>` +
            `<ul style="list-style: none; padding: 0; margin: 0;">${projectsListHTML || "<li style='text-align:center; color:#888'>No XP transactions found.</li>"}</ul>`;
    }
}