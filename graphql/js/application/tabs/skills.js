export function renderSkills(data) {
    if (!data || !data.skills) return;

    let skillsMap = {};
    data.skills.forEach(skill => {
        const name = skill.type.replace('skill_', '').toUpperCase();
        const projectName = skill.path ? skill.path.split('/').pop().replace(/-/g, ' ') : "Unknown";
        
        if (!skillsMap[name]) {
            skillsMap[name] = { maxAmount: 0, projects: [] };
        }
        skillsMap[name].projects.push({ name: projectName, amount: skill.amount });
        if (skill.amount > skillsMap[name].maxAmount) {
            skillsMap[name].maxAmount = skill.amount;
        }
    });

    const skillsHTML = Object.entries(skillsMap)
        .sort(([, a], [, b]) => b.maxAmount - a.maxAmount)
        .map(([name, info]) => `
            <div class="skill-tag" onclick="showSkillProjects('${name}', ${JSON.stringify(info.projects).replace(/"/g, '&quot;')})">
                <span class="skill-name">${name}</span>
                <span class="skill-amount">${info.maxAmount}%</span>
            </div>
        `).join('');

    const container = document.getElementById('skills-container');
    if (container) {
        container.innerHTML = `
            <div class="skills-grid">${skillsHTML}</div>
            <div id="projects-panel" class="projects-panel">
                <p class="placeholder-text">Click a skill</p>
            </div>
        `;
    }
}

window.showSkillProjects = function(skillName, projects) {
    const panel = document.getElementById('projects-panel');
    const projectsList = projects
        .sort((a, b) => b.amount - a.amount)
        .map(p => {
            const textColor = p.amount === 0 ? 'color: #fc2525;' : '';
            return `
            <div class="project-item">
                <span>${p.name}</span>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${p.amount}%"></div>
                </div>
                <span style="${textColor}">${p.amount}%</span>
            </div>
        `}).join('');

    panel.innerHTML = `
        <h3>Projects for <span class="projnameskill">${skillName}</span></h3>
        <div class="projects-list">${projectsList}</div>
    `;
};