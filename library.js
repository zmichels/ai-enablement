/* Builds concise local briefs; optional AI tailoring is handled separately. */
(function () {
  "use strict";
  const Brief=typeof module!=="undefined"&&module.exports?require("./brief.js"):globalThis.WorkBrief;
  const approaches = {
    direct: ["Get to the useful bit", "Lead with the useful answer or draft. Keep the explanation proportionate."],
    coach: ["Teach me as we go", "Explain one useful choice at a time and offer a small chance to practice. Do not turn the whole task into a lecture."],
    explore: ["Give me a few possibilities", "Offer three distinct possibilities, including the simplest. Explain the main tradeoff briefly."],
    demo: ["Make a tiny demo", "Make the smallest useful mockup or example with made-up data. Label simulated behavior. Use an inspectable format supported by your tools; do not publish or connect live services merely to demonstrate the idea."],
    review: ["Be my second pair of eyes", "Review the supplied work for its intended use. Find the most consequential gaps and suggest concrete fixes. Say if there is no draft to review."]
  };
  const depths = {
    brief: ["Keep it short", "Keep the result concise. Include any caveat that changes how I should use it."],
    balanced: ["Enough to be useful", "Give enough detail to use the result without burying the point."],
    careful: ["Take a closer look", "Check the facts and assumptions that could change the result. Explain the important evidence, alternatives and remaining uncertainty."]
  };
  const voices = {
    natural: ["Plain and friendly", "Use natural, respectful language. Avoid corporate filler and forced enthusiasm."],
    warm: ["A little warmer", "Be warm and encouraging while remaining direct and truthful. Do not patronize the reader."],
    playful: ["Room for a little wit", "A light analogy or gentle wit is welcome when it fits the audience. Keep sensitive and safety-critical material clear and respectful; do not force a joke."]
  };
  const wildCards = [
    "Give me a small before-and-after so I can see the difference.",
    "Use a potluck analogy if it fits, then bring it back to the real task.",
    "Offer one unexpected but practical option alongside the obvious one.",
    "Give the result a memorable, gently playful title if the setting allows it.",
    "Show me a first version I could improve in five minutes."
  ];
  function buildHelpers(config, input) {
    if (!["combined", "separate"].includes(input.mode)) throw new Error("Choose one helper or separate prompts.");
    const selected = [...new Set(input.ids || [])].map(id => {
      const entry = config.entries.find(e => e.id === id);
      if (!entry || !["role", "expertise", "context"].includes(entry.kind) || !(entry.kind==="context"?entry.prompt:entry.brief)) throw new Error("That selection is unavailable.");
      return entry;
    });
    const skills = selected.filter(e => e.kind !== "context");
    const context = selected.filter(e => e.kind === "context");
    if (!skills.length) throw new Error("Choose at least one work area or skill. Start with whatever sounds useful.");
    const options = [[approaches,input.approach || "direct"],[depths,input.depth || "balanced"],[voices,input.voice || "natural"]];
    if (options.some(([bank,key]) => !bank[key])) throw new Error("Choose an available response preference.");
    const preferences = options.map(([bank,key]) => bank[key][1]);
    const compose = entries => {
      const all = [...entries,...context];
      const result=Brief.compose(config,{entries:all,task:input.task,experience:input.experience,preferences,nudge:input.nudge,depth:input.depth,internal:config.internal,base:input.base,
        references:all.map(e=>e.title+": "+Brief.reference(e.path,input.base))});
      return {title:entries.length===1?entries[0].title:"Combined work brief",ids:all.map(e=>e.id),...result};
    };
    return input.mode === "separate" ? skills.map(e => compose([e])) : [compose(skills)];
  }
  function nextWildCard(previous, random = Math.random) {
    let index = Math.floor(random()*wildCards.length);
    if(wildCards[index]===previous) index=(index+1)%wildCards.length;
    return wildCards[index];
  }
  if (typeof module !== "undefined" && module.exports) module.exports = {buildHelpers, nextWildCard, approaches, depths, voices};
  if (typeof document === "undefined") return;
  const config=JSON.parse(document.getElementById("helper-config").textContent);
  const byId=id=>document.getElementById(id);
  const selected=new Set();
  let results=[];
  const tailoring=globalThis.BriefGeneration.attach("helper",()=>results.length===1?results[0].text:"",()=>results[0]?.resources||[]);
  for(const [id,bank] of [["approach",approaches],["depth",depths],["voice",voices]]) {
    Object.entries(bank).forEach(([value,[label]])=>{const o=document.createElement("option");o.value=value;o.textContent=label;byId(id).append(o);});
  }
  byId("depth").value="balanced";
  const categories=[...new Set(config.entries.filter(e=>e.kind==='role').map(e=>e.category))];
  for (const [value,label] of [["featured","A few good starting points"],["all","All skills"],...categories.map(c=>[c,c])]) {
    const o=document.createElement("option");o.value=value;o.textContent=label;byId("skill-group").append(o);
  }
  function invalidate(){tailoring.invalidate();results=[];byId("helper-results").replaceChildren();byId("download-helpers").disabled=true;byId("helper-status").textContent="";}
  function updateShelf(){Brief.shelf(byId("helper-shelf"),config,byId("helper-task").value,[...selected],config.internal,id=>{selected.add(id);invalidate();render();});}
  function selectionSummary(){
    updateShelf();
    const area=byId("selected-helpers");area.replaceChildren();
    if(!selected.size){area.textContent="Pick a work area, a skill, or a little of both. You can change your mind.";return;}
    selected.forEach(id=>{
      const e=config.entries.find(e=>e.id===id);const button=document.createElement("button");button.type="button";button.className="chip";button.textContent=e.title+" ×";button.setAttribute("aria-label","Remove "+e.title);
      button.addEventListener("click",()=>{selected.delete(id);invalidate();render();});area.append(button);
    });
  }
  function render(){
    const query=byId("helper-search").value.toLowerCase().trim();
    for (const [kind,id] of [["expertise","expertise-grid"],["role","skills-grid"],["context","context-grid"]]) {
      const grid=byId(id);if(!grid)continue;grid.replaceChildren();
      config.entries.filter(e=>e.kind===kind && (!query || (e.title+' '+e.use_when+' '+e.id+' '+e.category).toLowerCase().includes(query)) && (kind!=='role'|| query || selected.has(e.id)||byId("skill-group").value==='all'||(byId("skill-group").value==='featured'?e.featured:e.category===byId("skill-group").value))).forEach(e=>{
        const card=document.createElement("article");card.className="card compact";
        const label=document.createElement("label");const check=document.createElement("input");check.type="checkbox";check.value=e.id;check.checked=selected.has(e.id);
        check.addEventListener("change",()=>{check.checked?selected.add(e.id):selected.delete(e.id);invalidate();selectionSummary();});
        const strong=document.createElement("strong");strong.textContent=e.title;label.append(check,strong);
        const p=document.createElement("p");p.textContent=e.use_when;
        const a=document.createElement("a");a.href=e.path;a.textContent=kind==='context'?"Read the context →":"Read the method →";
        card.append(label,p,a);grid.append(card);
      });
      if(!grid.children.length){const p=document.createElement("p");p.textContent="Nothing here matches yet. Try another word or clear the search.";grid.append(p);}
    }
    selectionSummary();
  }
  byId("helper-search").addEventListener("input",render);byId("skill-group").addEventListener("change",render);
  for(const id of ["helper-task","approach","depth","voice","helper-mode","creative-nudge","helper-experience"])byId(id).addEventListener("input",()=>{invalidate();updateShelf();});
  byId("wild-card").addEventListener("click",()=>{byId("creative-nudge").value=nextWildCard(byId("creative-nudge").value);invalidate();byId("wild-status").textContent="A little possibility, added below. Edit it or clear it if it is not your thing.";});
  byId("clear-nudge").addEventListener("click",()=>{byId("creative-nudge").value="";byId("wild-status").textContent="Creative nudge cleared.";invalidate();});
  byId("helper-builder").addEventListener("submit",event=>{
    event.preventDefault();invalidate();
    try{
      results=buildHelpers(config,{ids:[...selected],mode:byId("helper-mode").value,task:byId("helper-task").value,experience:byId("helper-experience").value,approach:byId("approach").value,depth:byId("depth").value,voice:byId("voice").value,nudge:byId("creative-nudge").value,base:/^https?:$/.test(location.protocol)?new URL('.',location.href).href:''});
      results.forEach((result,index)=>{
        const section=document.createElement("section");section.className="helper-result";
        const label=document.createElement("label");label.htmlFor="helper-output-"+index;label.textContent=result.title;
        const text=document.createElement("textarea");text.id=label.htmlFor;text.value=result.text;text.readOnly=true;text.rows=12;
        const copy=document.createElement("button");copy.type="button";copy.className="secondary";copy.textContent="Copy "+(results.length===1?"brief":result.title);
        copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(result.text);byId("helper-status").textContent="Copied. Give the brief to your assistant and start the work.";}catch(_){text.focus();text.select();byId("helper-status").textContent="Text selected. Use your usual Copy command.";}});
        section.append(label,text,copy);byId("helper-results").append(section);
      });
      byId("download-helpers").disabled=false;byId("helper-status").textContent=results.length===1?"A focused brief, ready for your assistant. Tailor it with AI below if a connection is available.":results.length+" separate briefs, ready to copy. Use one combined brief for AI tailoring.";
    }catch(error){byId("helper-status").textContent=error.message;}
  });
  byId("download-helpers").addEventListener("click",()=>{
    const content=results.map((r,i)=>"<!-- Prompt "+(i+1)+": "+r.title+" -->\n"+r.text).join("\n\n====================\n\n");
    const url=URL.createObjectURL(new Blob([content],{type:"text/markdown;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="my-helpers.md";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
}());
