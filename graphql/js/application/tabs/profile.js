export function renderProfile(data, userData){
    if (!data || !data.transaction) return;

      const ratio = userData.auditRatio || 0;
        const totalUp = ((userData.totalUp || 0) / 1000000).toFixed(2);
        const totalDown = ((userData.totalDown || 0) / 1000000).toFixed(2);
        
        let xp = 0;
        if (data.transaction) {
            data.transaction.forEach(tx => xp += tx.amount);
        }
        const xpDisplay = (xp / 1000).toFixed(0) + " kB";
    
        const profileHTML = `
            <div class="card">
                <h3>Identity</h3>
                <p>ID: #${userData.id}</p>
                <p style="font-size: 0.7em; color: rgba(255,255,255,0.6);">${userData.login}</p>
            </div>
            <div class="card">
                <h3>Audit Ratio</h3>
                <p style="color: ${ratio >= 1 ? '#4ade80' : '#fb923c'}">${ratio.toFixed(1)}</p>
                <div style="font-size: 0.75em; color: rgba(255,255,255,0.6); display: flex; justify-content: space-around; margin-top: 10px;">
                    <span>⬆ ${totalUp} MB</span>
                    <span>⬇ ${totalDown} MB</span>
                </div>
            </div>
            <div class="card">
                <h3>Total XP</h3>
                <p>${xpDisplay}</p>
            </div>
        `;
        const profileGrid = document.getElementById('profile-grid');
        if(profileGrid) profileGrid.innerHTML = profileHTML;
}