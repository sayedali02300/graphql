// 1. AUDIT RATIO GRAPH (Bar Chart)
export function createAuditGraph(user) {
  const up = user.totalUp || 0;
  const down = user.totalDown || 0;
  const total = Math.max(up, down) || 1;

  // IF TOTAL  IS 1 = 100%
  // MAKE UP/TOTAL * 120 [PIXELS] MAXIMUM HEIGHT
  const h1 = (up / total) * 120;
  const h2 = (down / total) * 120;

  return `
        <div class="chart-wrapper">
            <svg viewBox="0 0 500 180">
                <rect x="0" y="0" width="500" height="180" fill="#0f0f19" rx="8"/>
                <line x1="80" y1="140" x2="420" y2="140" stroke="#333" stroke-width="2"/>
                
                <rect x="150" y="${140 - h1}" width="70" height="${h1}" fill="#4ade80"/>
                <text x="185" y="158" text-anchor="middle" font-size="13" fill="#ccc" font-weight="600">Done</text>
                <text x="185" y="${135 - h1}" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">${(up / 1000000).toFixed(2)}MB</text>
                
                <rect x="280" y="${140 - h2}" width="70" height="${h2}" fill="#ec7f0b"/>
                <text x="315" y="158" text-anchor="middle" font-size="13" fill="#ccc" font-weight="600">Received</text>
                <text x="315" y="${135 - h2}" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">${(down / 1000000).toFixed(2)}MB</text>
            </svg>
            <div class="ratioUnderAuditGraph">
                Ratio: <span style="font-weight: bold; color: ${user.auditRatio >= 1 ? "#4ade80" : "#fb923c"}; font-size: 1.3em;">${user.auditRatio.toFixed(1)}</span>
            </div>
        </div>
    `;
}

// 2. XP PROGRESSION GRAPH
export function createXPGraph(transactions) {
  if (!transactions || transactions.length === 0) {
    const div = document.createElement("div");
    div.innerHTML = '<p class="noData">No XP data available</p>';
    return div;
  }

  const xpOnly = transactions.filter(tx => tx.type === 'xp');
  if (!xpOnly || xpOnly.length === 0) {
    const div = document.createElement("div");
    div.innerHTML = '<p class="noData">No XP data available</p>';
    return div;
  }
  
  // --- 1. DATA PROCESSING --
  const rawSorted = [...xpOnly].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  // here we hide the audits that i failed in
  const sorted = [];
  for (let i = 0; i < rawSorted.length; i++) {
    const current = rawSorted[i];
    const next = rawSorted[i + 1];
    if (next && current.amount > 0) {
      const sum = current.amount + next.amount;
      if (Math.abs(sum) <= 0) {
        i++;
        continue;
      }
    }
    sorted.push(current);
  }

  let cumulativeXP = 0;
  let groupedXP = 0;
  let groupedTx = null;

  const dataPoints = [];

  for (const tx of sorted) {
    const pathParts = tx.path.split("/");

    // if checkpoint
    if (pathParts.includes("checkpoint")) {
      groupedXP += tx.amount;

      if (!groupedTx) groupedTx = tx;
      continue;
    }

    cumulativeXP += tx.amount;
    const projectName = pathParts[pathParts.length - 1] || "Unknown";

    dataPoints.push({
      date: new Date(tx.createdAt),
      xp: cumulativeXP,
      increment: tx.amount,
      project: projectName
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      path: tx.path,
    });
  }
  if (groupedXP > 0 && groupedTx) {
    cumulativeXP += groupedXP;
    const projectName = "checkpoint XP";

    dataPoints.push({
      date: new Date(groupedTx.createdAt),
      xp: cumulativeXP,
      increment: groupedXP,
      project: projectName
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      path: groupedTx.path,
    });
    dataPoints.sort((a, b) => a.date - b.date);
    let runningXP = 0;
    for (const p of dataPoints) {
      runningXP += p.increment;
      p.xp = runningXP;
    }
  }

  // --- 2. CHART DIMENSIONS & SCALES ---
  const width = 900;
  const height = 350;
  const paddingLeft = 70;
  const paddingRight = 120;
  const paddingTop = 40;
  const paddingBottom = 60;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const minDate = dataPoints[0].date.getTime();
  const maxDate = Math.max(
    dataPoints[dataPoints.length - 1].date.getTime(),
    new Date().getTime(),
  );
  const maxXP = cumulativeXP;

  // turn time to px
  //max-min is how long is the date
  //timestamp-mindate gives the time between first project and current
  //turn it all to % so we can calc t he needed x for each point
  const scaleX = (timestamp) =>
    paddingLeft + ((timestamp - minDate) / (maxDate - minDate)) * chartWidth; //0.2 * 900 + 70padding
  const scaleY = (xpValue) =>
    height - paddingBottom - (xpValue / maxXP) * chartHeight; // turn xpval to % then * with height

  // --- 3. PATH GENERATION ---
  let pathData = "";
  // this move 70xp M=move
  let prevX = scaleX(dataPoints[0].date.getTime());
  // this first Y is down on bottom
  let prevY = scaleY(0);
  // M means move so move on X-70px Y-[350-60 = 290]
  pathData = `M ${prevX} ${prevY}`;

  dataPoints.forEach((point) => {
    const x = scaleX(point.date.getTime());
    const y = scaleY(point.xp);
    //     Y
    // x---|
    pathData += ` L ${x} ${prevY} L ${x} ${y}`;
    //Y----[this when prevX=x]
    prevX = x;
    prevY = y;
  });
  // from last project till the current time stay same Y
  pathData += ` L ${width - paddingRight} ${prevY}`;
  //L MEANS LINE TO SO DRAW LINE from -- TO --
  // L[width-padding] is for width
  // $height -> is for what height
  let areaPath =
    pathData + ` L ${width - paddingRight} ${height - paddingBottom} Z`; // Z means close

  // --- 4. INTERACTIVE POINTS PREP ---
  const hoverPoints = dataPoints.map((point) => {
    const x = scaleX(point.date.getTime());
    const y = scaleY(point.xp);

    return {
      x,
      y,
      dateStr: point.date
        .toLocaleString("en-BH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " •"),
      incrementStr: (point.increment / 1000).toFixed(2) + " kB",
      totalStr: (point.xp / 1000).toFixed(1) + " kB",
      project: point.project,
    };
  });

  // two point one that shown to user
  //one that accept hover but its hidden
  const pointsHTML = hoverPoints
    .map(
      (p, i) => `
        <g class="xp-data-point" data-index="${i}" style="cursor: pointer;">
            <circle cx="${p.x}" cy="${p.y}" r="3" fill="#06b6d4" stroke="#1a1a2e" stroke-width="1" />
            <circle cx="${p.x}" cy="${p.y}" r="15" fill="transparent" /> 
        </g>
    `,
    )
    .join("");

  const dateMarkers = [];
  for (let i = 0; i < 5; i++) {
    //when 0% do 0.4 when 50% do 2/4 etc
    const index = Math.floor(((dataPoints.length - 1) * i) / 4);
    const point = dataPoints[index];
    const x = scaleX(point.date.getTime());
    dateMarkers.push(`
            <line x1="${x}" y1="${height - paddingBottom}" x2="${x}" y2="${height - paddingBottom + 5}" stroke="#666" stroke-width="1"/>
            <text x="${x}" y="${height - paddingBottom + 20}" text-anchor="middle" font-size="11" fill="#999">${point.date.toLocaleDateString("en-BH", { day: "numeric", month: "short" })}</text>
        `);
  }

  const maxXPDisplay = (maxXP / 1000).toFixed(0) + " kB";

  // --- 5. BUILD THE DOM ELEMENT ---
  const container = document.createElement("div");
  container.className = "chart-wrapper xp-chart-container";
  container.style.position = "relative";

  // <g> means group like group of circules
  container.innerHTML = `
        <style>
            .xp-chart-container .xp-data-point circle:first-child { transition: r 0.2s, fill 0.2s; }
            .xp-chart-container .xp-data-point:hover circle:first-child { r: 6; fill: #22d3ee; filter: drop-shadow(0 0 8px #22d3ee); }
            
            .xp-tooltip.active { opacity: 1; display: block; }
            
            .tooltip-date { font-family: monospace; font-weight: 600; color: #a5f3fc; margin-bottom: 5px; font-size: 12px; }
            .tooltip-increment { color: #4ade80; font-weight: 700; font-size: 16px; margin-bottom: 5px; }
            .tooltip-project { font-size: 11px; color: #94a3b8; font-style: italic; margin-bottom: 8px; }
            .tooltip-total { color: #999; font-size: 11px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #333; display: flex; justify-content: space-between; }
        </style>
        
        <div class="xp-tooltip"></div>
        
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%;">
            <rect x="0" y="0" width="${width}" height="${height}" fill="#0f0f19" rx="8"/>
            <path d="${areaPath}" fill="rgba(6, 182, 212, 0.1)"/>
            <path d="${pathData}" fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            ${pointsHTML}
            ${dateMarkers.join("")}
            <text x="${width - paddingRight + 10}" y="${paddingTop + 20}" text-anchor="start" font-size="24" fill="#06b6d4" font-weight="700">${maxXPDisplay}</text>
        </svg>
    `;

  // --- 6. ATTACH EVENTS ---
  const tooltip = container.querySelector(".xp-tooltip");
  const points = container.querySelectorAll(".xp-data-point");

  points.forEach((point, index) => {
    const data = hoverPoints[index];

    point.addEventListener("mouseover", (e) => {
      tooltip.innerHTML = `
                <div class="tooltip-date">${data.dateStr}</div>
                <div class="tooltip-project">${data.project}</div>
                <div class="tooltip-increment">+${data.incrementStr}</div>
                <div class="tooltip-total"><span>Total Progress:</span> <span>${data.totalStr}</span></div>
            `;
      tooltip.classList.add("active");

      const circle = e.currentTarget.querySelector("circle");
      const circleRect = circle.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const realX = circleRect.left - containerRect.left;
      const realY = circleRect.top - containerRect.top;

      if (realX > containerRect.width - 220) {
        tooltip.style.left = realX - 215 + "px";
      } else {
        tooltip.style.left = realX + 15 + "px";
      }

      tooltip.style.top = realY - 10 + "px";
    });

    point.addEventListener("mouseleave", () => {
      tooltip.classList.remove("active");
    });
  });

  return container;
}

// Helper function
export function filterTransactionsByRange(transactions, range) {
  if (!transactions || transactions.length === 0) return [];
  const now = new Date();
  let cutoffDate;
  switch (range) {
    case "1week":
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1month":
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3months":
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "6months":
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    default:
      return transactions;
  }
  return transactions.filter((tx) => new Date(tx.createdAt) >= cutoffDate);
}
