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
    
    const container = document.getElementById("skills-container");
    if (!container) return;

    container.innerHTML = "";

    const skillsGrid = document.createElement("div");
    skillsGrid.className = "skills-grid"

    const projectsPanel = document.createElement("div");
    //delete maybe
    projectsPanel.id = "projects-panel";
    projectsPanel.className = "projects-panel";

    const placeholder = document.createElement("p");
    placeholder.className = 'placeholder-text';
    placeholder.textContent = "Click a skill";
    projectsPanel.appendChild(placeholder);

    Object.entries(skillsMap)
    .sort(([, a], [, b]) => b.maxAmount - a.maxAmount)
    .forEach(([skillName, info]) => {

        //create tags
        const skillTag = document.createElement("div");
        skillTag.className = "skill-tag";

        // the name of each skill
        const nameSpan = document.createElement("span");
        nameSpan.className = "skill-name";
        nameSpan.textContent = skillName +" ";

        // percentage
        const amountSpan = document.createElement("span");
        amountSpan.className = "skill-amount";
        amountSpan.textContent = `${info.maxAmount}` + "%";

        skillTag.addEventListener("click", () => {
            updateProjectsPanel(projectsPanel, skillName, info.projects);
        });

        skillTag.appendChild(nameSpan);
        skillTag.appendChild(amountSpan);
        skillsGrid.appendChild(skillTag);
    });

    container.appendChild(skillsGrid);
    container.appendChild(projectsPanel);
}

function updateProjectsPanel(panelElement, skillName, projects){
    // clean
    panelElement.innerHTML = "";

    const header = document.createElement("h3");
    header.textContent = "Projects for ";

    const spanName = document.createElement("span");
    spanName.className = "projnameskill";
    spanName.textContent = skillName;
    header.appendChild(spanName);

    panelElement.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.className = 'projects-list';

    projects
    .sort((a, b) => b.amount - a.amount)
    .forEach(p => {
        const item = document.createElement("div");
        item.className = "project-item";

        // name of project
        const pName = document.createElement("span");
        pName.textContent = p.name;

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-bar-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        progressBar.style.width = `${p.amount}%`;
        progressContainer.appendChild(progressBar);

        const pAmount = document.createElement('span');
        pAmount.textContent = `${p.amount}%`;
        if (p.amount === 0) {
            pAmount.style.color = '#fc2525';
        }
        item.appendChild(pName);
            item.appendChild(progressContainer);
            item.appendChild(pAmount);
            
            listContainer.appendChild(item);
        });
        panelElement.appendChild(listContainer)
}