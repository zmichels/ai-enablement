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
    const experience=input.experience||'helper';
    if(!['helper','work','explore'].includes(experience))throw new Error('Choose a helper setup or a task experience.');
    if (!["combined", "separate"].includes(input.mode)) throw new Error("Choose one helper or separate prompts.");
    const selected = [...new Set(input.ids || [])].map(id => {
      const entry = config.entries.find(e => e.id === id);
      if (!entry || !["role", "expertise", "context"].includes(entry.kind) || !(entry.kind==="context"?entry.prompt:entry.brief)) throw new Error("That selection is unavailable.");
      return entry;
    });
    const skills = selected.filter(e => e.kind !== "context"&&Brief.choice(input.mix?.[e.id]).use!=='omit');
    const context = selected.filter(e => e.kind === "context");
    const resources=Brief.selectedResources(config,input.task||'',skills.map(e=>e.id),config.internal,input.resourceChoices);
    if (!skills.length&&!context.length&&!resources.length) throw new Error("Choose a work area, a skill or a resource to include.");
    if(input.mode==='separate'&&!skills.length)throw new Error('Use one combined brief when no methods are selected.');
    const options = [[approaches,input.approach || "direct"],[depths,input.depth || "balanced"],[voices,input.voice || "natural"]];
    if (options.some(([bank,key]) => !bank[key])) throw new Error("Choose an available response preference.");
    const preferences = options.map(([bank,key]) => bank[key][1]);
    const compose = entries => {
      const all = [...entries,...context];
      const result=Brief.compose(config,{entries:all,task:input.task,experience,preferences,nudge:input.nudge,depth:input.depth,internal:config.internal,base:input.base,
        mix:input.mix,resourceChoices:input.resourceChoices,deliverable:input.deliverable,exclusions:input.exclusions,
        references:all.filter(e=>e.kind==='context'||Brief.choice(input.mix?.[e.id]).use!=='reference').map(e=>e.title+": "+Brief.reference(e.path,input.base))});
      const title=input.mode==='separate'?entries[0].title:experience==='helper'?'Your helper setup':entries.length===1?entries[0].title:'Combined work brief';
      return {title,ids:all.map(e=>e.id),...result};
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
  const mix={},resourceChoices={};
  let results=[];
  let revealed=null,resourceQuery='',resourceBrowseOpen=false;
  const tailoring=globalThis.BriefGeneration.attach("helper",()=>results.length===1?results[0].text:"",()=>results[0]?.resources||[],()=>results[0]?.purpose||'helper');
  for(const [id,bank] of [["approach",approaches],["depth",depths],["voice",voices]]) {
    Object.entries(bank).forEach(([value,[label]])=>{const o=document.createElement("option");o.value=value;o.textContent=label;byId(id).append(o);});
  }
  byId("depth").value="balanced";
  const categories=[...new Set(config.entries.filter(e=>e.selector_group==='skills').map(e=>e.category))];
  for (const [value,label] of [["featured","Featured skills"],["all","All skills"],...categories.map(c=>[c,c])]) {
    const o=document.createElement("option");o.value=value;o.textContent=label;byId("skill-group").append(o);
  }
  function invalidate(){tailoring.invalidate();results=[];byId("helper-results").replaceChildren();byId("download-helpers").disabled=true;byId("helper-status").textContent="";}
  function inputState(){return {ids:[...selected],mix,resourceChoices,task:byId('helper-task').value,deliverable:byId('helper-deliverable').value,exclusions:byId('helper-exclusions').value};}
  function activeIds(){return [...selected].filter(id=>Brief.choice(mix[id]).use!=='omit');}
  function element(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;}
  function field(parent,title,id,control){const label=element('label',title);label.htmlFor=id;control.id=id;parent.append(label,control);return control;}
  function menu(options,value){const select=element('select');options.forEach(([id,label])=>{const o=element('option',label);o.value=id;select.append(o);});select.value=value;return select;}
  function renderSummary(){
    const list=byId('mix-summary');list.replaceChildren();
    const group=(label,items)=>{if(!items.length)return;const row=element('div');row.append(element('dt',label),element('dd',items.join('; ')));list.append(row);};
    const entries=[...selected].map(id=>config.entries.find(e=>e.id===id));
    const describe=e=>{const c=Brief.choice(mix[e.id]);const b=e.brief&&Brief.method(e,byId('helper-task').value,c.method,byId('helper-experience').value);return e.title+(c.scope&&c.use!=='full'?' — '+c.scope:'')+(b?.matched&&!['reference','omit'].includes(c.use)?' · '+b.label:'');};
    group('Main focus',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='main').map(describe));
    group('Also use',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='full').map(describe));
    group('Borrow just',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='support').map(e=>describe(e)+(Brief.choice(mix[e.id]).scope?'':' — say which part below')));
    group('Keep handy',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='reference').map(describe));
    group('Guidance',entries.filter(e=>e.kind==='context').map(e=>e.title));
    const resources=Brief.resourceCandidates(config,byId('helper-task').value,activeIds(),config.internal,resourceChoices);
    for(const [use,label] of [['main','Primary'],['support','Borrow from'],['reference','References on hand']])group(label,resources.filter(e=>Brief.choice(resourceChoices[e.id],true).use===use).map(e=>e.title+(Brief.choice(resourceChoices[e.id],true).scope?' — '+Brief.choice(resourceChoices[e.id],true).scope:'')));
    group('Exclude',[...entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='omit'),...resources.filter(e=>Brief.choice(resourceChoices[e.id],true).use==='omit')].map(e=>e.title));
    group(byId('helper-experience').value==='helper'?'Preferred outputs':'Produce',byId('helper-deliverable').value.trim()?[byId('helper-deliverable').value.trim()]:[]);
    group('Exclude',byId('helper-exclusions').value.trim()?[byId('helper-exclusions').value.trim()]:[]);
    if(!list.children.length)group('Your mix',['None selected.']);
  }
  function renderMix(){
    const area=byId('mix-controls');area.replaceChildren();
    const entries=[...selected].map(id=>config.entries.find(e=>e.id===id)).filter(e=>e.kind!=='context');
    if(!entries.length)area.append(element('p','No method adjustments.','note'));
    entries.forEach(e=>{
      const c=Brief.choice(mix[e.id]),card=element('article',null,'mix-card');card.append(element('h3',e.title));
      const use=field(card,'Contribution','mix-use-'+e.id,menu(Object.entries(Brief.uses),c.use));
      const scope=field(card,'Scope','mix-scope-'+e.id,element('input'));scope.type='text';scope.maxLength=1000;scope.value=c.scope;scope.placeholder='Just the dependency map and status summary';scope.disabled=!['main','support','reference'].includes(c.use);scope.setAttribute('aria-required',String(c.use==='support'));
      use.addEventListener('change',()=>{mix[e.id]={...Brief.choice(mix[e.id]),scope:scope.value,use:use.value};if(use.value==='main')for(const id of Object.keys(mix))if(id!==e.id&&mix[id].use==='main')mix[id].use='full';invalidate();renderMix();updateShelf();byId('mix-use-'+e.id).focus();});
      scope.addEventListener('input',()=>{mix[e.id]={...Brief.choice(mix[e.id]),scope:scope.value};invalidate();renderSummary();});
      if(e.brief.variants.length){
        const method=field(card,'Method','mix-method-'+e.id,menu([['auto',byId('helper-experience').value==='helper'?'Full capability':'Match my request'],['usual','Use the usual approach'],...e.brief.variants.map(v=>[v.label,v.label])],c.method));method.disabled=['omit','reference'].includes(c.use);
        method.addEventListener('change',()=>{mix[e.id]={...Brief.choice(mix[e.id]),method:method.value};invalidate();renderSummary();});
      }
      area.append(card);
    });
    renderSummary();
  }
  function updateShelf(){
    const target=byId('helper-shelf');target.replaceChildren();target.hidden=false;
    const found=Brief.resourceCandidates(config,byId('helper-task').value,activeIds(),config.internal,resourceChoices);
    const suggestions=Brief.suggestions(config,byId('helper-task').value,[...selected],['role','expertise','context'],{
      internal:config.internal,includeResources:true,
      seedTargets:[...activeIds().map(id=>'entry:'+id),...Object.keys(resourceChoices).filter(id=>Brief.choice(resourceChoices[id],true).use!=='omit').map(id=>'resource:'+id)],
      excludeTargets:found.map(e=>'resource:'+e.id)
    });
    Brief.relatedPicks(target,suggestions,pick=>{
      if(pick.type==='resource')resourceChoices[pick.entry.id]={use:'reference'};else selected.add(pick.entry.id);
      invalidate();render();
    });
    target.append(element('h3','Resources'),element('p','Keep a reference, make it primary, or borrow one part.','note'));
    if(revealed?.type==='resource'&&!found.some(e=>e.id===revealed.item.id)){
      const e=revealed.item,preview=element('article',null,'resource-preview');preview.id=Brief.itemElementId(revealed.target);preview.tabIndex=-1;
      const heading=element('h4',e.title),details=Brief.resourceDetails(e,config,{internal:config.internal,onReveal:revealItem});details.open=true;
      const add=element('button','＋ Add reference','secondary');add.type='button';add.addEventListener('click',()=>{resourceChoices[e.id]={use:'reference'};invalidate();render();});
      const source=element('a','Source ↗');source.href=e.url;const actions=element('div',null,'actions');actions.append(add,source);
      preview.append(element('small','Preview · not selected'),heading,element('p',e.why),details,actions);target.append(preview);
    }
    const ul=element('ul',null,'capability-list');
    found.forEach(e=>{
      const c=Brief.choice(resourceChoices[e.id],true),li=element('li'),link=element('a',e.title);link.href=e.url;
      li.id=Brief.itemElementId('resource:'+e.id);li.tabIndex=-1;
      const details=Brief.resourceDetails(e,config,{internal:config.internal,onReveal:revealItem});
      if(revealed?.target==='resource:'+e.id){details.open=true;li.classList.add('is-revealed');}
      li.append(link,element('p',e.why),element('small',e.kind),details);
      const use=field(li,'Use as','resource-use-'+e.id,menu([['reference','Keep handy'],['main','Primary'],['support','One part'],['omit','Exclude']],c.use));
      const scope=field(li,'Scope','resource-scope-'+e.id,element('input'));scope.type='text';scope.maxLength=1000;scope.placeholder='Only the request / item / task relationships';scope.value=c.scope;scope.disabled=c.use==='omit';scope.setAttribute('aria-required',String(c.use==='support'));
      use.addEventListener('change',()=>{resourceChoices[e.id]={...c,scope:scope.value,use:use.value};if(use.value==='main')for(const id of Object.keys(resourceChoices))if(id!==e.id&&resourceChoices[id].use==='main')resourceChoices[id].use='reference';invalidate();updateShelf();byId('resource-use-'+e.id).focus();});
      scope.addEventListener('input',()=>{resourceChoices[e.id]={...Brief.choice(resourceChoices[e.id],true),scope:scope.value};invalidate();renderSummary();});
      ul.append(li);
    });target.append(ul);
    const browse=element('details',null,'resource-browse');browse.open=resourceBrowseOpen;browse.append(element('summary','＋ Add a resource'));
    browse.addEventListener('toggle',()=>{resourceBrowseOpen=browse.open;});
    const available=(config.capabilities||[]).filter(e=>(config.internal||e.audience==='public')&&!found.some(f=>f.id===e.id)).sort((a,b)=>a.title.localeCompare(b.title));
    const search=field(browse,'Find a resource','resource-search',element('input'));search.type='search';search.placeholder='Name or use case';search.value=resourceQuery;
    const picker=field(browse,'Resource','resource-picker',menu([],''));
    const tally=element('p',null,'note');tally.setAttribute('role','status');browse.append(tally);
    const filterResources=()=>{
      const matching=available.filter(e=>Brief.searchMatches(e,resourceQuery));picker.replaceChildren();
      const blank=element('option','Choose a resource…');blank.value='';picker.append(blank);
      matching.forEach(e=>{const option=element('option',e.title);option.value=e.id;picker.append(option);});
      picker.disabled=!matching.length;tally.textContent=!available.length?'All resources added.':matching.length?matching.length+' available':'No matches.';
    };
    search.addEventListener('input',()=>{resourceQuery=search.value;filterResources();});filterResources();
    picker.addEventListener('change',()=>{if(picker.value){const id=picker.value;resourceChoices[id]={use:'reference'};invalidate();updateShelf();byId('resource-use-'+id).focus();}});
    target.append(browse);
    renderSummary();
  }
  function selectionSummary(){
    for(const [kind,id] of [['perspectives','expertise-grid'],['skills','skills-grid']]){
      const count=byId(id+'-count');if(!count)continue;
      count.textContent=config.entries.filter(e=>e.selector_group===kind&&selected.has(e.id)).length+' selected';
    }
    updateShelf();
    const area=byId("selected-helpers");area.replaceChildren();
    if(!selected.size)area.textContent="None selected.";
    selected.forEach(id=>{
      const e=config.entries.find(e=>e.id===id);const button=document.createElement("button");button.type="button";button.className="chip";button.textContent=e.title+" ×";button.setAttribute("aria-label","Remove "+e.title);
      button.addEventListener("click",()=>{selected.delete(id);delete mix[id];invalidate();render();});area.append(button);
    });
    renderMix();
  }
  function render(){
    const query=byId("helper-search").value.trim();
    for (const [kind,id] of [["perspectives","expertise-grid"],["skills","skills-grid"]]) {
      const grid=byId(id);if(!grid)continue;grid.replaceChildren();
      config.entries.filter(e=>e.selector_group===kind && (revealed?.target==='entry:'+e.id||((!query||Brief.searchMatches(e,query))&&(kind!=='skills'||query||selected.has(e.id)||byId("skill-group").value==='all'||(byId("skill-group").value==='featured'?e.featured:e.category===byId("skill-group").value))))).sort((a,b)=>a.title.localeCompare(b.title)).forEach(e=>{
        const card=document.createElement("article");card.className="card compact";
        card.id=Brief.itemElementId('entry:'+e.id);card.tabIndex=-1;
        const label=document.createElement("label");const check=document.createElement("input");check.type="checkbox";check.value=e.id;check.checked=selected.has(e.id);
        check.addEventListener("change",()=>{if(check.checked)selected.add(e.id);else{selected.delete(e.id);delete mix[e.id];}invalidate();selectionSummary();});
        const strong=document.createElement("strong");strong.textContent=e.title;label.append(check,strong);
        const p=document.createElement("p");p.textContent=e.use_when;
        const a=document.createElement("a");a.href=e.path;a.textContent="Source ↗";
        const detail=element('details'),summary=element('summary','Details');
        summary.setAttribute('aria-label','Details: '+e.title);detail.append(summary,p);
        if(e.brief)detail.append(element('p','When '+e.brief.activation));
        detail.append(Brief.discoveryDetails(e,config,{internal:config.internal,target:'entry:'+e.id,onReveal:revealItem}));
        if(revealed?.target==='entry:'+e.id){detail.open=true;card.classList.add('is-revealed');}
        detail.append(a);card.append(label,detail);grid.append(card);
      });
      if(!grid.children.length){const p=document.createElement("p");p.textContent="No matches.";grid.append(p);}
    }
    selectionSummary();
  }
  function revealItem(target,caseId,updateLocation=true){
    const query='?item='+encodeURIComponent(target)+(caseId?'&case='+encodeURIComponent(caseId):'');
    const item=Brief.readItem(config,query,config.internal);if(!item)return;
    revealed=item;
    if(updateLocation){try{history.pushState(null,'',query);}catch(_){/* File previews may not allow history changes. */}}
    render();
    const card=byId(Brief.itemElementId(target));
    const focus=caseId?byId(Brief.itemElementId(target)+'-case-'+caseId):card;
    if(focus){focus.tabIndex=-1;focus.focus({preventScroll:true});focus.scrollIntoView({block:'center'});}
  }
  function clearReveal(){revealed=null;try{const url=new URL(location.href);url.searchParams.delete('item');url.searchParams.delete('case');history.replaceState(null,'',url);}catch(_){}}
  byId("helper-search").addEventListener("input",()=>{clearReveal();render();});byId("skill-group").addEventListener("change",()=>{clearReveal();render();});
  for(const id of ["helper-task","approach","depth","voice","helper-mode","creative-nudge"])byId(id).addEventListener("input",()=>{invalidate();updateShelf();});
  function experienceLabels(){
    const helper=byId('helper-experience').value==='helper';
    byId('helper-task-label').textContent=helper?'Your context':'Your task';
    byId('helper-task').placeholder=helper?'Role, work area and preferences':'Task, intended outcome and constraints';
    byId('helper-deliverable-label').textContent=helper?'Preferred outputs':'Desired output';
    byId('helper-experience-note').textContent=helper?'Skills for ongoing work. No task required.':'Describe the task. Your skills shape the approach.';
    byId('helper-build').textContent=helper?'Build helper prompt':'Prepare work brief';
  }
  byId('helper-experience').addEventListener('change',()=>{invalidate();experienceLabels();renderMix();updateShelf();});
  for(const id of ['helper-deliverable','helper-exclusions'])byId(id).addEventListener('input',()=>{invalidate();renderSummary();});
  byId('reset-mix').addEventListener('click',()=>{for(const id of Object.keys(mix))delete mix[id];for(const id of Object.keys(resourceChoices))delete resourceChoices[id];byId('helper-deliverable').value='';byId('helper-exclusions').value='';invalidate();renderMix();updateShelf();});
  byId("wild-card").addEventListener("click",()=>{byId("creative-nudge").value=nextWildCard(byId("creative-nudge").value);invalidate();byId("wild-status").textContent="Creative direction added.";});
  byId("clear-nudge").addEventListener("click",()=>{byId("creative-nudge").value="";byId("wild-status").textContent="Creative nudge cleared.";invalidate();});
  byId("helper-builder").addEventListener("submit",event=>{
    event.preventDefault();invalidate();
    try{
      results=buildHelpers(config,{...inputState(),mode:byId("helper-mode").value,experience:byId("helper-experience").value,approach:byId("approach").value,depth:byId("depth").value,voice:byId("voice").value,nudge:byId("creative-nudge").value,base:/^https?:$/.test(location.protocol)?new URL('.',location.href).href:''});
      results.forEach((result,index)=>{
        const section=document.createElement("section");section.className="helper-result";
        const label=document.createElement("label");label.htmlFor="helper-output-"+index;label.textContent=result.title;
        const text=document.createElement("textarea");text.id=label.htmlFor;text.value=result.text;text.readOnly=true;text.rows=12;
        const copy=document.createElement("button");copy.type="button";copy.className="secondary";copy.textContent="Copy "+(results.length===1?"prompt":result.title);
        copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(result.text);byId("helper-status").textContent="Prompt copied.";}catch(_){text.focus();text.select();byId("helper-status").textContent="Text selected. Use your usual Copy command.";}});
        section.append(label,text,copy);byId("helper-results").append(section);
      });
      byId("download-helpers").disabled=false;byId("helper-status").textContent=results.length===1?(results[0].purpose==='helper'?"Helper setup ready.":"Work brief ready."):results.length+" prompts ready. AI tailoring requires one combined prompt.";
    }catch(error){byId("helper-status").textContent=error.message;}
  });
  byId("download-helpers").addEventListener("click",()=>{
    const content=results.map((r,i)=>"<!-- Prompt "+(i+1)+": "+r.title+" -->\n"+r.text).join("\n\n====================\n\n");
    const url=URL.createObjectURL(new Blob([content],{type:"text/markdown;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="my-helpers.md";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  window.addEventListener('popstate',()=>{const item=Brief.readItem(config,location.search,config.internal);if(item)revealItem(item.target,item.useCase?.id,false);else{revealed=null;render();}});
  experienceLabels();
  const initial=Brief.readItem(config,location.search,config.internal);
  if(initial)revealItem(initial.target,initial.useCase?.id,false);else render();
}());
