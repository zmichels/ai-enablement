/* No network requests or persistent storage. */
(function () {
  "use strict";
  const Brief=typeof module!=="undefined"&&module.exports?require("./brief.js"):globalThis.WorkBrief;
  function buildLaunch(config, input) {
    const route = config.routes.find(r => r.id === input.route);
    if (!route) throw new Error("Choose an available route.");
    const selected = (ids, kind) => [...new Set(ids || [])].map(id => {
      const entry = config.entries.find(e => e.id === id && e.kind === kind);
      if (!entry || !route.kinds.includes(kind)) throw new Error("Selection is unavailable on this route.");
      return entry;
    });
    const jobs = selected(input.jobs, "role");
    const context = selected(input.context, "context");
    const outcome = (input.outcome || "").trim();
    if (!outcome) throw new Error("Describe the outcome you want.");
    if (route.kinds.includes("role") && !jobs.length) throw new Error("Select at least one job.");
    if (route.kinds.includes("context") && !context.length) throw new Error("Select at least one context area.");
    const base = /^https?:\/\//.test(input.base || "") ? input.base : "";
    const ref = path => base ? new URL(path, base).href : path;
    return Brief.compose(config,{entries:[...jobs,...context],task:outcome,experience:input.experience,base,
      internal:input.route!=="public",references:[...route.entryPoints.map(ref),...jobs.map(e=>ref(e.path)+(e.artifact?" → "+ref(e.artifact):"")),...context.map(e=>ref(e.path))]}).text;
  }

  function generateExample(config, input, random = Math.random) {
    const bank = config.generators[input.route];
    if (!bank) throw new Error("No examples are available for this route.");
    const scenarios = bank.scenarios.filter(s => !input.theme || input.theme === "any" || s.id === input.theme);
    if (!scenarios.length) throw new Error("Choose an available example theme.");
    const pick = items => Math.floor(random() * items.length);
    const scenario = scenarios[pick(scenarios)];
    const choice = {situation:pick(scenario.situations), request:pick(scenario.requests),
      format:pick(scenario.formats), constraint:pick(scenario.constraints)};
    const key = () => [input.route, scenario.id, ...Object.values(choice)].join("/");
    if(key()===input.previousKey) choice.situation=(choice.situation+1)%scenario.situations.length;
    const request=scenario.requests[choice.request];
    const format=scenario.formats[choice.format];
    const example={route:input.route,
      jobs:[...new Set([...scenario.jobs,...request.jobs,...format.jobs])],context:[...scenario.context],
      outcome:scenario.situations[choice.situation].text+"\n\n"+request.instruction+" "+format.instruction+" "+scenario.constraints[choice.constraint],
      key:key(),summary:scenario.title,parts:{scenario:scenario.id,...choice}};
    buildLaunch(config, example); // Validate the selection without building anything in the UI.
    return example;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { buildLaunch, generateExample };
  if (typeof document === "undefined") return;
  const config = JSON.parse(document.getElementById("launch-config").textContent);
  const route = document.getElementById("route");
  const search = document.getElementById("search");
  const grid = document.getElementById("catalog");
  const group = document.getElementById("catalog-group");
  const count = document.getElementById("selection-count");
  const output = document.getElementById("prompt");
  const status = document.getElementById("status");
  const outcome = document.getElementById("outcome");
  const theme = document.getElementById("example-theme");
  const exampleStatus = document.getElementById("example-status");
  const restore = document.getElementById("restore-draft");
  let previousKey = "";
  let savedDraft = null;
  const chosen = new Set();
  const tailoring=globalThis.BriefGeneration.attach("task",()=>output.value,()=>Brief.suggest(config,outcome.value,[...chosen],route.value!=="public").map(r=>({...r,url:Brief.reference(r.url,location.href)})));
  function updateShelf(){const active=config.routes.find(r=>r.id===route.value);Brief.shelf(document.getElementById("task-shelf"),config,outcome.value,[...chosen],route.value!=="public",id=>{chosen.add(id);invalidate();render();},active.kinds);}
  config.routes.forEach(r => { const o = document.createElement("option"); o.value = r.id; o.textContent = r.title; route.append(o); });
  function renderThemes() {
    theme.replaceChildren();
    const any = document.createElement("option"); any.value = "any"; any.textContent = "Surprise me"; theme.append(any);
    config.generators[route.value].scenarios.forEach(s => {
      const option = document.createElement("option"); option.value = s.id; option.textContent = s.title; theme.append(option);
    });
    previousKey = ""; exampleStatus.textContent = "";
  }
  function renderGroups() {
    group.replaceChildren();
    const current=config.routes.find(r=>r.id===route.value);
    const categories=[...new Set(config.entries.filter(e=>current.kinds.includes(e.kind)).map(e=>e.category))];
    [["featured","A few good starting points"],["all","Everything"],...categories.map(c=>[c,c])].forEach(([value,label])=>{
      const o=document.createElement("option");o.value=value;o.textContent=label;group.append(o);
    });
  }
  function render() {
    updateShelf();
    const current = config.routes.find(r => r.id === route.value);
    const query = search.value.toLowerCase();
    grid.replaceChildren();
    count.textContent=chosen.size?chosen.size+" selected. Your choices stay selected while you browse.":"Choose one or a few. There is no perfect combination to get right.";
    config.entries.filter(e => current.kinds.includes(e.kind) && (e.title + " " + e.use_when + " " + e.id + " " + e.category).toLowerCase().includes(query) && (query || chosen.has(e.id) || group.value==="all" || (group.value==="featured" ? e.featured : e.category===group.value))).forEach(e => {
      const card = document.createElement("article"); card.className = "card";
      const label = document.createElement("label");
      const input = document.createElement("input"); input.type = "checkbox"; input.value = e.id; input.checked = chosen.has(e.id);
      input.addEventListener("change", () => { if(input.checked) chosen.add(e.id); else chosen.delete(e.id); invalidate(); updateShelf();count.textContent=chosen.size+" selected. Your choices stay selected while you browse."; });
      const title = document.createElement("strong"); title.textContent = e.title;
      label.append(input, title);
      const kind = document.createElement("small"); kind.textContent = e.kind === "role" ? e.category : "Context · " + e.category;
      const p = document.createElement("p"); p.textContent = e.use_when;
      const link = document.createElement("a"); link.href = e.path; link.textContent = e.kind === "role" ? "Read the prompt →" : "Read the context →";
      card.append(kind, label, p, link); grid.append(card);
    });
    if (!grid.children.length) { const p = document.createElement("p"); p.textContent = "No matches. Try another term."; grid.append(p); }
  }
  function invalidate() { tailoring.invalidate();output.value = ""; document.getElementById("copy").disabled = true; document.getElementById("download").disabled = true; status.textContent = ""; }
  route.addEventListener("change", () => { chosen.clear(); invalidate(); renderThemes(); renderGroups(); render(); });
  search.addEventListener("input", render);
  group.addEventListener("change",render);
  outcome.addEventListener("input", ()=>{invalidate();updateShelf();});
  document.getElementById("task-experience").addEventListener("input",invalidate);
  document.getElementById("generate-example").addEventListener("click", () => {
    const example = generateExample(config, {route:route.value, theme:theme.value, previousKey});
    if (!savedDraft) savedDraft = {route:route.value, outcome:outcome.value, chosen:[...chosen], search:search.value, rows:outcome.rows, group:group.value};
    previousKey = example.key;
    outcome.value = example.outcome; outcome.rows = 8;
    chosen.clear(); [...example.jobs, ...example.context].forEach(id => chosen.add(id));
    search.value = ""; invalidate(); render(); restore.disabled = false;
    exampleStatus.textContent = "Loaded: " + example.summary + ". Edit the outcome or selections, then prepare your work brief.";
  });
  document.getElementById("own-task").addEventListener("click",()=>{
    if(!savedDraft) savedDraft={route:route.value,outcome:outcome.value,chosen:[...chosen],search:search.value,rows:outcome.rows,group:group.value};
    outcome.value=""; outcome.rows=4; previousKey=""; invalidate();restore.disabled=false;
    exampleStatus.textContent="A fresh start. Your selections are still here—describe your own task above."; outcome.focus();
  });
  restore.addEventListener("click", () => {
    if (!savedDraft) return;
    route.value = savedDraft.route; outcome.value = savedDraft.outcome; outcome.rows = savedDraft.rows;
    search.value = savedDraft.search; chosen.clear(); savedDraft.chosen.forEach(id => chosen.add(id));
    const savedGroup=savedDraft.group; savedDraft = null; restore.disabled = true; invalidate(); renderThemes(); renderGroups(); group.value=savedGroup; render();
    exampleStatus.textContent = "Your previous draft and selections are restored. Prepare the brief when ready.";
  });
  document.getElementById("builder").addEventListener("submit", e => {
    e.preventDefault();
    try {
      const active = config.routes.find(r => r.id === route.value);
      output.value = buildLaunch(config, {route: route.value, outcome: document.getElementById("outcome").value,
        jobs: config.entries.filter(e => e.kind === "role" && active.kinds.includes("role") && chosen.has(e.id)).map(e => e.id),
        context: config.entries.filter(e => e.kind === "context" && active.kinds.includes("context") && chosen.has(e.id)).map(e => e.id),
        experience: document.getElementById("task-experience").value,
        base: /^https?:$/.test(location.protocol) ? new URL(".", location.href).href : ""});
      output.focus(); output.setSelectionRange(0,0); output.scrollTop=0;
      status.textContent = "Your work brief is ready. Copy it to your assistant or tailor it with a configured AI connection below.";
      document.getElementById("copy").disabled = false; document.getElementById("download").disabled = false;
    } catch (error) { invalidate(); status.textContent = error.message; }
  });
  document.getElementById("copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(output.value); status.textContent = "Launch request copied."; }
    catch (_) { output.focus(); output.select(); status.textContent = "Text selected. Use your usual Copy command."; }
  });
  document.getElementById("download").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([output.value], {type:"text/markdown;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "agent-launch.md"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  renderThemes(); renderGroups(); render();
}());
