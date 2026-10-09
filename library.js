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
  const Discovery=globalThis.CatalogDiscovery,presentation=config.presentation;
  const catalogItems=Discovery.items(config);
  const shortTitle=e=>Discovery.label({id:(config.entries.includes(e)?'entry:':'resource:')+e.id,title:e.title},presentation);
  let organization='topic',layout='tree',kind='all',selectedOnly=false;
  const branchState=new Map();
  const selected=new Set();
  const mix={},resourceChoices={};
  let results=[];
  let revealed=null,resourceQuery='',resourceBrowseOpen=false;
  const tailoring=globalThis.BriefGeneration.attach("helper",()=>results.length===1?results[0].text:"",()=>results[0]?.resources||[],()=>results[0]?.purpose||'helper');
  for(const [id,bank] of [["approach",approaches],["depth",depths],["voice",voices]]) {
    Object.entries(bank).forEach(([value,[label]])=>{const o=document.createElement("option");o.value=value;o.textContent=label;byId(id).append(o);});
  }
  byId("depth").value="balanced";
  for (const [value,label] of [['','All topics'],...Discovery.group(catalogItems,'topic',presentation).map(g=>[g.key,g.title])]) {
    const o=document.createElement('option');o.value=value;o.textContent=label;byId('skill-group').append(o);
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
    const describe=e=>{const c=Brief.choice(mix[e.id]);const b=e.brief&&Brief.method(e,byId('helper-task').value,c.method,byId('helper-experience').value);return shortTitle(e)+(c.scope&&c.use!=='full'?' — '+c.scope:'')+(b?.matched&&!['reference','omit'].includes(c.use)?' · '+b.label:'');};
    group('Main focus',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='main').map(describe));
    group('Also use',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='full').map(describe));
    group('Borrow just',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='support').map(e=>describe(e)+(Brief.choice(mix[e.id]).scope?'':' — say which part below')));
    group('Keep handy',entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='reference').map(describe));
    group('Guidance',entries.filter(e=>e.kind==='context').map(e=>shortTitle(e)));
    const resources=Brief.resourceCandidates(config,byId('helper-task').value,activeIds(),config.internal,resourceChoices);
    for(const [use,label] of [['main','Primary'],['support','Borrow from'],['reference','References on hand']])group(label,resources.filter(e=>Brief.choice(resourceChoices[e.id],true).use===use).map(e=>shortTitle(e)+(Brief.choice(resourceChoices[e.id],true).scope?' — '+Brief.choice(resourceChoices[e.id],true).scope:'')));
    group('Exclude',[...entries.filter(e=>e.kind!=='context'&&Brief.choice(mix[e.id]).use==='omit'),...resources.filter(e=>Brief.choice(resourceChoices[e.id],true).use==='omit')].map(e=>shortTitle(e)));
    group(byId('helper-experience').value==='helper'?'Preferred outputs':'Produce',byId('helper-deliverable').value.trim()?[byId('helper-deliverable').value.trim()]:[]);
    group('Exclude',byId('helper-exclusions').value.trim()?[byId('helper-exclusions').value.trim()]:[]);
    if(!list.children.length)group('Your mix',['None selected.']);
  }
  function renderMix(){
    const area=byId('mix-controls');area.replaceChildren();
    const entries=[...selected].map(id=>config.entries.find(e=>e.id===id)).filter(e=>e.kind!=='context');
    if(!entries.length)area.append(element('p','No method adjustments.','note'));
    entries.forEach(e=>{
      const c=Brief.choice(mix[e.id]),card=element('article',null,'mix-card');card.append(element('h3',shortTitle(e)));
      const use=field(card,'Contribution','mix-use-'+e.id,menu(Object.entries(Brief.uses),c.use));
      const scope=field(card,'Scope','mix-scope-'+e.id,element('input'));scope.type='text';scope.maxLength=1000;scope.value=c.scope;scope.placeholder='Just the dependency map and status summary';scope.disabled=!['main','support','reference'].includes(c.use);scope.setAttribute('aria-required',String(c.use==='support'));
      use.addEventListener('change',()=>{mix[e.id]={...Brief.choice(mix[e.id]),scope:scope.value,use:use.value};if(use.value==='main')for(const id of Object.keys(mix))if(id!==e.id&&mix[id].use==='main')mix[id].use='full';invalidate();render();byId('mix-use-'+e.id).focus();});
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
    const ul=element('ul',null,'capability-list');
    found.forEach(e=>{
      const c=Brief.choice(resourceChoices[e.id],true),li=element('li'),link=element('a',shortTitle(e));link.href=e.url;
      li.id='shelf-'+Brief.itemElementId('resource:'+e.id);li.tabIndex=-1;
      const details=Brief.resourceDetails(e);
      if(revealed?.target==='resource:'+e.id){details.open=true;li.classList.add('is-revealed');}
      li.append(link,element('p',e.why),element('small',e.kind),details);
      const use=field(li,'Use as','resource-use-'+e.id,menu([['reference','Keep handy'],['main','Primary'],['support','One part'],['omit','Exclude']],c.use));
      const scope=field(li,'Scope','resource-scope-'+e.id,element('input'));scope.type='text';scope.maxLength=1000;scope.placeholder='Only the request / item / task relationships';scope.value=c.scope;scope.disabled=c.use==='omit';scope.setAttribute('aria-required',String(c.use==='support'));
      use.addEventListener('change',()=>{resourceChoices[e.id]={...c,scope:scope.value,use:use.value};if(use.value==='main')for(const id of Object.keys(resourceChoices))if(id!==e.id&&resourceChoices[id].use==='main')resourceChoices[id].use='reference';invalidate();render();byId('resource-use-'+e.id).focus();});
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
      matching.forEach(e=>{const option=element('option',shortTitle(e));option.value=e.id;picker.append(option);});
      picker.disabled=!matching.length;tally.textContent=!available.length?'All resources added.':matching.length?matching.length+' available':'No matches.';
    };
    search.addEventListener('input',()=>{resourceQuery=search.value;filterResources();});filterResources();
    picker.addEventListener('change',()=>{if(picker.value){const id=picker.value;resourceChoices[id]={use:'reference'};invalidate();render();byId('resource-use-'+id).focus();}});
    target.append(browse);
    renderSummary();
  }
  function chosenResources(){return Brief.selectedResources(config,byId('helper-task').value,activeIds(),config.internal,resourceChoices);}
  function isSelected(item){return item.kind==='resource'?chosenResources().some(e=>e.id===item.source.id):selected.has(item.source.id);}
  function selectionSummary(){
    updateShelf();
    const area=byId('selected-helpers');area.replaceChildren();
    const chosen=catalogItems.filter(isSelected);byId('mix-count').textContent=String(chosen.length);
    byId('helper-build').disabled=!chosen.length;
    if(!chosen.length)area.textContent='No selections';
    chosen.forEach(item=>{
      const button=element('button',Discovery.label(item,presentation)+' ×','chip');button.type='button';button.setAttribute('aria-label','Remove '+Discovery.label(item,presentation));
      button.addEventListener('click',()=>{if(item.kind==='resource')resourceChoices[item.source.id]={use:'omit'};else{selected.delete(item.source.id);delete mix[item.source.id];}invalidate();render();});area.append(button);
    });
    renderMix();
  }
  function branchIcon(name){
    const paths={search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',layers:'<path d="m12 3 10 6-10 6L2 9Zm-10 11 10 6 10-6"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>',file:'<path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 12h8M8 16h6"/>',chat:'<path d="M3 4h18v13H8l-5 4Zm4 5h10M7 13h7"/>',globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',spark:'<path d="m13 2-9 12h7l-1 8 10-12h-7Z"/>'};
    const span=element('span',null,'branch-symbol');span.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'+(paths[name]||paths.layers)+'</svg>';return span;
  }
  function toggleBranchLabel(){const open=byId('catalog-grid').querySelector('.catalog-branch[open]');byId('toggle-branches').textContent=open?'Collapse all':'Expand all';}
  function render(){
    const query=byId('helper-search').value.trim(),topic=byId('skill-group').value;
    const items=catalogItems.filter(item=>revealed?.target===item.id||((kind==='all'||item.kind===kind)&&(!topic||Discovery.inTopic(item,topic,presentation))&&(!selectedOnly||isSelected(item))&&Brief.searchMatches({...item.source,title:item.title+' '+Discovery.label(item,presentation)},query)));
    const grid=byId('catalog-grid');grid.replaceChildren();grid.classList.toggle('catalog-tree',layout==='tree');
    const cardFor=item=>{
      const e=item.source,card=element('article',null,'card compact'),label=element('label'),check=element('input');
      card.id=Brief.itemElementId(item.id);card.tabIndex=-1;check.type='checkbox';check.value=item.kind==='resource'?item.id:e.id;check.checked=isSelected(item);check.setAttribute('aria-label',Discovery.label(item,presentation)+', '+(Discovery.names[item.kind]||item.kind));
      check.addEventListener('change',()=>{if(item.kind==='resource')resourceChoices[e.id]={use:check.checked?'reference':'omit'};else if(check.checked)selected.add(e.id);else{selected.delete(e.id);delete mix[e.id];}invalidate();render();byId(Brief.itemElementId(item.id))?.querySelector('input')?.focus();});
      label.append(check,element('strong',Discovery.label(item,presentation)));label.title=e.use_when||e.why||'';
      const detail=element('details',null,'selector-detail'),summary=element('summary','ⓘ');summary.setAttribute('aria-label','Details: '+Discovery.label(item,presentation));summary.title='Details';detail.append(summary,element('p',e.use_when||e.why));
      if(e.brief)detail.append(element('p','When '+e.brief.activation));
      if(item.kind==='resource')detail.append(Brief.resourceDetails(e));
      detail.append(Brief.discoveryDetails(e,config,{internal:config.internal,target:item.id,onReveal:revealItem}));
      const source=element('a','Source ↗');source.href=item.kind==='resource'?e.url:e.path;detail.append(source);
      if(revealed?.target===item.id){detail.open=true;card.classList.add('is-revealed');}
      card.append(label,detail);return card;
    };
    const branchFor=(group,parent=organization)=>{
      const branch=element('details',null,'catalog-branch'),stateKey=parent+':'+group.key;branch.dataset.branch=stateKey;branch.open=Boolean(query)||group.items.some(i=>i.id===revealed?.target)||(branchState.get(stateKey)??true);
      const heading=element('summary',null,'branch-heading');if(group.icon)heading.append(branchIcon(group.icon));heading.append(element('span',group.title));
      const count=group.items.filter(isSelected).length,tally=element('span',count?'✓ '+count+' · '+group.items.length:String(group.items.length),'branch-count');tally.setAttribute('aria-label',count+' selected of '+group.items.length);heading.append(tally);
      const nodes=element('div',null,group.children?'catalog-subgroups':'branch-nodes');
      if(group.children)group.children.forEach(child=>nodes.append(branchFor(child,stateKey)));else group.items.forEach(item=>nodes.append(cardFor(item)));
      branch.append(heading,nodes);branch.addEventListener('toggle',()=>{if(!query&&!revealed)branchState.set(stateKey,branch.open);toggleBranchLabel();});return branch;
    };
    if(layout==='tree')Discovery.group(items,organization,presentation,topic).forEach(g=>grid.append(branchFor(g)));
    else Discovery.browse(items,organization,presentation,topic).forEach(item=>grid.append(cardFor(item)));
    byId('catalog-count').textContent=items.length+' / '+catalogItems.length;byId('catalog-empty').hidden=items.length>0;byId('toggle-branches').hidden=layout!=='tree'||!items.length;toggleBranchLabel();selectionSummary();
  }
  function revealItem(target,caseId,updateLocation=true){
    const query='?item='+encodeURIComponent(target)+(caseId?'&case='+encodeURIComponent(caseId):'');
    const item=Brief.readItem(config,query,config.internal);if(!item)return;
    revealed=item;byId('catalog-panel').open=true;
    if(updateLocation){try{history.pushState(null,'',query);}catch(_){/* File previews may not allow history changes. */}}
    render();
    const card=byId(Brief.itemElementId(target));
    const focus=caseId?byId(Brief.itemElementId(target)+'-case-'+caseId):card;
    if(focus){focus.tabIndex=-1;focus.focus({preventScroll:true});focus.scrollIntoView({block:'center'});}
  }
  function clearReveal(){revealed=null;try{const url=new URL(location.href);url.searchParams.delete('item');url.searchParams.delete('case');history.replaceState(null,'',url);}catch(_){}}
  byId("helper-search").addEventListener("input",()=>{clearReveal();render();});byId("skill-group").addEventListener("change",()=>{clearReveal();render();});
  byId('catalog-organization').addEventListener('change',event=>{organization=event.target.value;render();});
  for(const attr of ['kind','layout'])document.querySelectorAll('[data-'+attr+']').forEach(button=>button.addEventListener('click',()=>{if(attr==='kind')kind=button.dataset.kind;else layout=button.dataset.layout;document.querySelectorAll('[data-'+attr+']').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));clearReveal();render();}));
  byId('selected-only').addEventListener('click',event=>{selectedOnly=!selectedOnly;event.currentTarget.setAttribute('aria-pressed',String(selectedOnly));clearReveal();render();});
  byId('toggle-branches').addEventListener('click',()=>{const branches=[...byId('catalog-grid').querySelectorAll('.catalog-branch')],open=!branches.some(b=>b.open);branches.forEach(b=>{b.open=open;branchState.set(b.dataset.branch,open);});toggleBranchLabel();});
  byId('clear-catalog-filters').addEventListener('click',()=>{kind='all';selectedOnly=false;byId('helper-search').value='';byId('skill-group').value='';document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind==='all')));byId('selected-only').setAttribute('aria-pressed','false');clearReveal();render();});
  for(const id of ["helper-task","approach","depth","voice","helper-mode","creative-nudge"])byId(id).addEventListener("input",()=>{invalidate();render();});
  function experienceLabels(){
    const helper=byId('helper-experience').value==='helper';
    byId('helper-task-label').textContent=helper?'Your context':'Your task';
    byId('helper-task').placeholder=helper?'Role, work area and preferences':'Task, intended outcome and constraints';
    byId('helper-deliverable-label').textContent=helper?'Preferred outputs':'Desired output';
    byId('helper-experience-note').textContent=helper?'Skills for ongoing work. No task required.':'Describe the task. Your skills shape the approach.';
    byId('helper-build').textContent=helper?'Build helper':'Build task prompt';
  }
  byId('helper-experience').addEventListener('change',()=>{invalidate();experienceLabels();renderMix();updateShelf();});
  for(const id of ['helper-deliverable','helper-exclusions'])byId(id).addEventListener('input',()=>{invalidate();renderSummary();});
  byId('reset-mix').addEventListener('click',()=>{for(const id of Object.keys(mix))delete mix[id];for(const id of Object.keys(resourceChoices))delete resourceChoices[id];byId('helper-deliverable').value='';byId('helper-exclusions').value='';invalidate();render();});
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
      byId('catalog-panel').open=false;byId('output-heading').focus();byId('output-heading').scrollIntoView({block:'start'});
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
