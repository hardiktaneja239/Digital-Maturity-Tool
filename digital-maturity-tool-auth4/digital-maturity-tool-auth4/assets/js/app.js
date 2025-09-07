
// Core app logic shared across pages
window.App = (() => {
  const BANDS = [
    { name: "Low", test: (v) => v < 2, cls: "low" },
    { name: "Emerging", test: (v) => v >= 2 && v < 3, cls: "emerging" },
    { name: "Developing", test: (v) => v >= 3 && v < 4, cls: "developing" },
    { name: "Strong", test: (v) => v >= 4, cls: "strong" },
  ];

  const getBand = (v) => BANDS.find(b => b.test(v));

  // --- Example question bank (shortened) ---
  window.QUIZ_BANK = [
    { category: "Strategy & Leadership", items: [
      "We have a written digital roadmap with quarterly targets.",
      "Digital projects have clear owners and KPIs.",
      "We review progress against KPIs at least monthly.",
      "Budget is allocated to digital improvements.",
      "Leaders champion automation and integration."
    ]},
    { category: "Technology & Integration", items: [
      "Core systems integrate (no rekeying).",
      "APIs or connectors are used where available.",
      "We standardize tools and versions.",
      "Cloud systems adopted were beneficial.",
      "Vendors support change in a timely way."
    ]},
    { category: "Processes & Workflow", items: [
      "Handoffs are standardised with SOPs.",
      "Manual steps are identified and automated.",
      "There is a single source of truth for tasks/data.",
      "Teams use the same trackers/boards.",
      "The Workload is visible in real time."
    ]},
    { category: "Data & Analytics", items: [
      "Data is captured consistently at source.",
      "Decision makers see live dashboards.",
      "Each KPI has a named owner.",
      "We use basic analytics to guide actions.",
      "Data quality is reviewed regularly."
    ]},
    { category: "Customer Experience (CX)", items: [
      "We collect structured feedback (CSAT/NPS).",
      "Feedback is reviewed on a cadence.",
      "We act on trends, not just complaints.",
      "Digital channels are monitored and improved.",
      "Customers get consistent multi‑channel service."
    ]},
    { category: "Governance & Change", items: [
      "We run a fortnightly change cadence.",
      "Priorities are clear and agreed.",
      "Improvements are tracked to done.",
      "We communicate change to all teams.",
      "Vendors/internal teams have SLAs."
    ]},
  ];

  // Growth actions (sample)
  window.GROWTH_ACTIONS = {
    "Technology & Integration": [
      { title:"Map all data re-entries", why:"Remove double entry", how:"List apps, fields, owners; choose API/connector", kpi:"# of re-entries -> 0" },
      { title:"Pilot integration for top process", why:"Save time fast", how:"Pick 1 workflow; integrate via Zapier/API", kpi:"Minutes saved / week" },
      { title:"Vendor change log", why:"Create leverage", how:"Monthly call; track asks and deadlines", kpi:"% vendor asks delivered" }
    ],
    "Processes & Workflow": [
      { title:"SOP template rollout", why:"Consistency", how:"Create SOP template; apply to top 5 tasks", kpi:"% tasks with SOP" },
      { title:"Board unification", why:"Reduce handoff delays", how:"One shared tracker with swimlanes", kpi:"Avg. cycle time" },
      { title:"Automation shortlist", why:"Focus effort", how:"Identify top 3 manual steps & tools", kpi:"Hours saved/month" }
    ],
    "Data & Analytics": [
      { title:"KPI ownership map", why:"Accountability", how:"Assign owners; weekly 15-min review", kpi:"% KPIs with owners" },
      { title:"Define data dictionary", why:"Quality", how:"Agree field meanings and formats", kpi:"Data errors / week" },
      { title:"Ops dashboard v1", why:"Visibility", how:"One-page live metrics", kpi:"Time to detect issues" }
    ]
  };

  // ----- QUIZ -----
  function initQuiz(){
    const form = document.getElementById('quizForm');
    const bar = document.getElementById('bar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    const bank = window.QUIZ_BANK;
    let index = 0;
    const answers = {}; // { category: [1..5 per item] }

    function render(){
      form.innerHTML = "";
      const cat = bank[index];
      const fs = document.createElement('fieldset');
      const lg = document.createElement('legend');
      lg.textContent = `${index+1}/${bank.length} • ${cat.category}`;
      fs.appendChild(lg);

      cat.items.forEach((q,i) => {
        const wrap = document.createElement('div');
        wrap.className = 'q';
        const p = document.createElement('p');
        p.textContent = `${i+1}. ${q}`;
        wrap.appendChild(p);

        const scale = document.createElement('div');
        scale.className = 'scale';
        for(let v=1; v<=5; v++){
          const id = `c${index}q${i}r${v}`;
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = `q${i}`;
          input.value = v;
          input.id = id;
          if (answers[cat.category]?.[i] === v) input.checked = true;
          label.setAttribute('for', id);
          label.appendChild(input);
          label.appendChild(document.createTextNode(String(v)));
          scale.appendChild(label);
        }
        wrap.appendChild(scale);
        fs.appendChild(wrap);
      });

      form.appendChild(fs);
      bar.style.width = `${Math.round(((index+1)/bank.length)*100)}%`;
      prevBtn.disabled = index === 0;
      nextBtn.textContent = index === bank.length - 1 ? 'Finish' : 'Next';
    }

    function capture(){
      const cat = bank[index];
      const values = [];
      cat.items.forEach((q,i) => {
        const checked = form.querySelector(`input[name="q${i}"]:checked`);
        values.push(checked ? Number(checked.value) : null);
      });
      answers[cat.category] = values;
    }

    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      capture();
      if (index>0){ index--; render(); }
    });

    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      capture();
      // require all selected
      const missing = Object.values(answers[bank[index].category] || []).some(v => v===null);
      if (missing) { alert('Please rate all statements (1–5).'); return; }
      if (index < bank.length - 1){
        index++; render();
      } else {
        // compute results
        const result = {};
        Object.entries(answers).forEach(([cat, arr]) => {
          const vals = arr.map(Number);
          const sum = vals.reduce((a,b)=>a+b,0);
          result[cat] = Number((sum / vals.length).toFixed(2));
        });
        localStorage.setItem('assessmentResults', JSON.stringify(result));
        const all = JSON.parse(localStorage.getItem('allAssessmentResults') || "[]");
        all.push({ ts: new Date().toISOString(), result });
        localStorage.setItem('allAssessmentResults', JSON.stringify(all));
        window.location.href = 'results.html';
      }
    });

    render();
  }

  // ----- RESULTS -----
  function initResults(){
    const raw = localStorage.getItem('assessmentResults');
    if(!raw){ alert('No results found. Please take the assessment first.'); window.location.href='quiz.html'; return; }
    const results = JSON.parse(raw);
    const categories = Object.keys(results);
    const values = categories.map(c => results[c]);

    // compute overall
    const overall = Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(2));
    const ob = getBand(overall);
    const ovEl = document.getElementById('overallScore');
    const obEl = document.getElementById('overallBand');
    if (ovEl && obEl){ ovEl.textContent = overall.toFixed(2); obEl.textContent = `(${ob.name})`; obEl.className = `band ${ob.cls}`; }

    // chart
    const ctx = document.getElementById('radar').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'radar',
      data: { labels: categories, datasets: [{ label: 'Score', data: values, fill: true }] },
      options: {
        scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 }, grid: { color: '#22304e' }, angleLines: { color: '#22304e' }, pointLabels: { color: '#cfe0ff' } } },
        plugins: { legend: { labels: { color: '#cfe0ff' } } }
      }
    });

    // score cards
    const scoresEl = document.getElementById('scores');
    categories.forEach((c) => {
      const v = results[c];
      const band = getBand(v);
      const div = document.createElement('div');
      div.className = 'score-card card';
      div.style.background = '#0e1730';
      div.innerHTML = `<h3>${c}</h3>
        <p><strong>${v.toFixed(2)}</strong> <span class="band ${band.cls}">(${band.name})</span></p>`;
      scoresEl.appendChild(div);
    });

    // actions for low categories (<3)
    const lowCats = categories.filter(c => results[c] < 3);
    const container = document.getElementById('actions');
    if (lowCats.length === 0){
      const p = document.createElement('p');
      p.textContent = 'Great work — no categories below 3. Use the Growth Planner to push further.';
      container.appendChild(p);
    } else {
      lowCats.forEach((cat) => {
        const actions = (window.GROWTH_ACTIONS[cat] || []).slice(0,3);
        actions.forEach(a => {
          const card = document.createElement('div');
          card.className = 'action card';
          card.innerHTML = `
            <h4>${cat}: ${a.title}</h4>
            <p><small>Why:</small> ${a.why}</p>
            <p><small>How:</small> ${a.how}</p>
            <p><small>KPI:</small> ${a.kpi}</p>`;
          container.appendChild(card);
        });
      });
    }

    // exports
    document.getElementById('exportTxt').addEventListener('click', () => {
      const lines = [];
      lines.push('Digital Maturity Assessment — Results');
      lines.push(new Date().toLocaleString());
      lines.push('');
      lines.push(`Overall: ${overall.toFixed(2)} (${ob.name})`);
      lines.push('');
      categories.forEach(c => {
        const v = results[c];
        const band = getBand(v);
        lines.push(`${c}: ${v.toFixed(2)} (${band.name})`);
      });
      if (lowCats.length){
        lines.push(''); lines.push('Targeted Actions (first 3 per low category):');
        lowCats.forEach(cat => {
          lines.push(`- ${cat}`);
          (window.GROWTH_ACTIONS[cat] || []).slice(0,3).forEach(a => {
            lines.push(`   • ${a.title} — Why: ${a.why} | How: ${a.how} | KPI: ${a.kpi}`);
          });
        });
      }
      const blob = new Blob([lines.join('\n')], {type: 'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'digital-maturity-results.txt';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('exportPng').addEventListener('click', () => {
      const url = chart.toBase64Image('image/png', 1);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'digital-maturity-chart.png';
      a.click();
    });

    document.getElementById('exportPdf').addEventListener('click', async () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFont('helvetica','normal');
      doc.setFontSize(14);
      doc.text('Digital Maturity Assessment — Summary', 40, 40);
      doc.setFontSize(10);
      let y = 70;
      doc.text(`Overall: ${overall.toFixed(2)} (${ob.name})`, 40, y); y += 16;
      categories.forEach(c => {
        const v = results[c];
        const band = getBand(v);
        doc.text(`${c}: ${v.toFixed(2)} (${band.name})`, 40, y);
        y += 16;
      });
      const img = chart.toBase64Image('image/png', 1);
      doc.addImage(img, 'PNG', 300, 40, 260, 260);
      y = Math.max(y, 320) + 20;
      doc.setFontSize(12);
      doc.text('Targeted Actions', 40, y); y += 14;
      doc.setFontSize(10);
      if (lowCats.length === 0){
        doc.text('No low-scoring categories. Use Growth Planner for next steps.', 40, y);
      } else {
        lowCats.forEach(cat => {
          doc.text(`• ${cat}`, 40, y); y += 14;
          (window.GROWTH_ACTIONS[cat] || []).slice(0,3).forEach(a => {
            const lines = doc.splitTextToSize(`- ${a.title} | Why: ${a.why} | How: ${a.how} | KPI: ${a.kpi}`, 520);
            lines.forEach(line => { doc.text(line, 56, y); y += 12; });
            y += 6;
          });
          y += 6;
        });
      }
      doc.save('digital-maturity-summary.pdf');
    });
  }

  // ----- GROWTH PLANNER -----
  function initGrowth(){
    const sel = document.getElementById('catSelect');
    const btn = document.getElementById('loadActions');
    const out = document.getElementById('plannerActions');
    const actions = window.GROWTH_ACTIONS;
    const cats = Object.keys(actions);
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });

    function render(cat){
      out.innerHTML = "";
      (actions[cat] || []).forEach((a,idx) => {
        const card = document.createElement('div');
        card.className = 'action card';
        card.innerHTML = `
          <h4>${a.title}</h4>
          <p><small>Why:</small> ${a.why}</p>
          <p><small>How:</small> ${a.how}</p>
          <p><small>KPI:</small> ${a.kpi}</p>
          <div style="margin-top:8px">
            <label>Owner</label>
            <input data-field="owner" data-idx="${idx}" placeholder="Name / role" class="input" aria-label="Owner for action ${idx+1}">
            <label>Target Date</label>
            <input data-field="date" data-idx="${idx}" type="date" class="input" aria-label="Target date for action ${idx+1}">
          </div>
        `;
        out.appendChild(card);
      });
    }

    btn.addEventListener('click', () => render(sel.value));

    // TXT export (fixed to read inputs correctly)
    document.getElementById('exportPlanTxt').addEventListener('click', () => {
      const cat = sel.value;
      const lines = [];
      lines.push(`Growth Plan — ${cat}`);
      lines.push(new Date().toLocaleString());
      lines.push('');
      (actions[cat] || []).forEach((a, idx) => {
        const owner = out.querySelector(`input[data-field="owner"][data-idx="${idx}"]`)?.value || '';
        const date = out.querySelector(`input[data-field="date"][data-idx="${idx}"]`)?.value || '';
        lines.push(`• ${a.title}`);
        lines.push(`  Why: ${a.why}`);
        lines.push(`  How: ${a.how}`);
        lines.push(`  KPI: ${a.kpi}`);
        if (owner) lines.push(`  Owner: ${owner}`);
        if (date) lines.push(`  Target: ${date}`);
        lines.push('');
      });
      const blob = new Blob([lines.join('\n')], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `growth-plan-${cat.replace(/\s+/g,'-').toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // PNG export (visible area of planner)
    document.getElementById('exportPlanPng').addEventListener('click', async () => {
      const el = document.getElementById('planner');
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0b1220' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url; a.download = 'growth-plan.png';
      a.click();
    });

    // PDF export
    document.getElementById('exportPlanPdf').addEventListener('click', async () => {
      const el = document.getElementById('planner');
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0b1220' });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit:'pt', format:'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      // Fit image to page width
      const ratio = canvas.height / canvas.width;
      const w = pageW - 60;
      const h = w * ratio;
      doc.addImage(imgData, 'PNG', 30, 30, w, h);
      doc.save('growth-plan.pdf');
    });
  }

  return { initQuiz, initResults, initGrowth };
})();
