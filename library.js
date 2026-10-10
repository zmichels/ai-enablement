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
  const variantFormat='skillforge-variant',variantVersion=1,maxDraftLength=100000;
  function validateVariant(value,config){
    const plain=value&&typeof value==='object'&&!Array.isArray(value);
    if(!plain||value.format!==variantFormat||value.version!==variantVersion||value.edition!==config.edition.id)throw new Error('This variant is not for this edition of the Workbench.');
    if(typeof value.name!=='string'||!value.name.trim()||value.name.length>80)throw new Error('Give the variant a name under 80 characters.');
    const state=value.workspace,allowedEntries=new Set(config.entries.map(e=>e.id)),allowedResources=new Set((config.capabilities||[]).map(e=>e.id));
    if(!state||typeof state!=='object'||Array.isArray(state)||!Array.isArray(state.ids)||state.ids.length>allowedEntries.size||new Set(state.ids).size!==state.ids.length||state.ids.some(id=>!allowedEntries.has(id)))throw new Error('This variant uses unavailable skills.');
    for(const [field,bank] of [['experience',{helper:1,work:1,explore:1}],['mode',{combined:1,separate:1}],['approach',approaches],['depth',depths],['voice',voices]])if(!Object.hasOwn(bank,state[field]))throw new Error('This variant has an unavailable output setting.');
    for(const field of ['task','deliverable','exclusions','nudge'])if(typeof state[field]!=='string'||state[field].length>10000)throw new Error('This variant has invalid context.');
    for(const [field,allowed] of [['mix',allowedEntries],['resourceChoices',allowedResources]]){
      const choices=state[field];if(!choices||typeof choices!=='object'||Array.isArray(choices))throw new Error('This variant has invalid selections.');
      for(const [id,choice] of Object.entries(choices))if(!allowed.has(id)||!choice||typeof choice!=='object'||Array.isArray(choice)||!Object.hasOwn(Brief.uses,choice.use)||typeof choice.scope!=='string'||choice.scope.length>1000||(field==='mix'&&(typeof choice.method!=='string'||choice.method.length>100)))throw new Error('This variant has unavailable selection details.');
    }
    if(!Array.isArray(value.drafts)||!value.drafts.length||value.drafts.length>config.entries.length||value.drafts.some(d=>!d||typeof d.text!=='string'||d.text.length>maxDraftLength))throw new Error('This variant has no usable draft.');
    if(typeof value.id!=='string'||!/^v-[a-z0-9-]{8,80}$/.test(value.id)||typeof value.savedAt!=='string'||Number.isNaN(Date.parse(value.savedAt)))throw new Error('This variant has invalid file metadata.');
    // Rebuild against the current catalog to validate the mix without trusting imported source metadata.
    const generated=buildHelpers(config,{...state,base:''});
    if(generated.length!==value.drafts.length)throw new Error('This variant does not match its selections.');
    return {format:variantFormat,version:variantVersion,edition:value.edition,id:value.id,name:value.name.trim(),savedAt:value.savedAt,workspace:{...state,ids:[...state.ids],mix:{...state.mix},resourceChoices:{...state.resourceChoices}},drafts:value.drafts.map(d=>({text:d.text}))};
  }
  if (typeof module !== "undefined" && module.exports) module.exports = {buildHelpers, nextWildCard, validateVariant, approaches, depths, voices};
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
  let results=[],resultWorkspace=null,savedVariants=[],unavailableVariants=[],revisions=[],activeVariantId='',blockedVariantBundle='',recoveryExported=false;
  let revealed=null,resourceQuery='',resourceBrowseOpen=false;
  const tailoring=globalThis.BriefGeneration.attach("helper",()=>results.length===1?results[0].text:"",()=>results[0]?.resources||[],()=>results[0]?.purpose||'helper');
  const variantStorageKey='skillforge.variants.v1.'+config.edition.id;
  for(const [id,bank] of [["approach",approaches],["depth",depths],["voice",voices]]) {
    Object.entries(bank).forEach(([value,[label]])=>{const o=document.createElement("option");o.value=value;o.textContent=label;byId(id).append(o);});
  }
  byId("depth").value="balanced";
  for (const [value,label] of [['','All topics'],...Discovery.group(catalogItems,'topic',presentation).map(g=>[g.key,g.title])]) {
    const o=document.createElement('option');o.value=value;o.textContent=label;byId('skill-group').append(o);
  }
  function invalidate(){tailoring.invalidate();if(results.length)byId('helper-status').textContent='Draft kept. Build again to use the changed mix.';}
  function inputState(){return {ids:[...selected],mix,resourceChoices,task:byId('helper-task').value,deliverable:byId('helper-deliverable').value,exclusions:byId('helper-exclusions').value};}
  function workspaceState(){return {...inputState(),mix:Object.fromEntries(Object.entries(mix).map(([id,c])=>[id,Brief.choice(c)])),resourceChoices:Object.fromEntries(Object.entries(resourceChoices).map(([id,c])=>[id,Brief.choice(c,true)])),experience:byId('helper-experience').value,mode:byId('helper-mode').value,approach:byId('approach').value,depth:byId('depth').value,voice:byId('voice').value,nudge:byId('creative-nudge').value};}
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
  function baseUrl(){return /^https?:$/.test(location.protocol)?new URL('.',location.href).href:'';}
  function newVariantId(){return 'v-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);}
  function download(content,type,name){
    const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function archiveResults(){
    if(!results.length||!resultWorkspace)return;
    revisions.unshift({workspace:resultWorkspace,drafts:results.map(r=>({text:r.text})),label:results.length===1?results[0].title:results.length+' prompts',at:new Date().toLocaleTimeString()});
    revisions=revisions.slice(0,12);renderRevisions();
  }
  function renderRevisions(){
    const list=byId('earlier-drafts'),count=byId('earlier-count');list.replaceChildren();count.textContent=String(revisions.length);byId('earlier-panel').hidden=!revisions.length;
    revisions.forEach((revision,index)=>{
      const row=element('div',null,'variant-row'),label=element('span',revision.label+' · '+revision.at),restore=element('button','Restore','text-button');restore.type='button';
      restore.addEventListener('click',()=>{const [snapshot]=revisions.splice(index,1);archiveResults();restoreSnapshot(snapshot);byId('helper-status').textContent='Earlier draft restored. Your previous draft is still in Earlier drafts.';});
      row.append(label,restore);list.append(row);
    });
  }
  function renderResults(){
    byId('helper-results').replaceChildren();
    results.forEach((result,index)=>{
      const section=element('section',null,'helper-result'),label=element('label',result.title),text=element('textarea');label.htmlFor='helper-output-'+index;text.id=label.htmlFor;text.value=result.text;text.rows=12;
      text.addEventListener('input',()=>{result.text=text.value;tailoring.invalidate();byId('helper-status').textContent='Draft edited. Save a variant to keep it in this browser.';});
      const copy=element('button','Copy '+(results.length===1?'prompt':result.title),'secondary');copy.type='button';
      copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.text);byId('helper-status').textContent='Prompt copied.';}catch(_){text.focus();text.select();byId('helper-status').textContent='Text selected. Use your usual Copy command.';}});
      section.append(label,text,copy);byId('helper-results').append(section);
    });
    byId('download-helpers').disabled=!results.length;byId('save-variant').disabled=!results.length;
  }
  function restoreSnapshot(snapshot){
    const state=snapshot.workspace;
    selected.clear();state.ids.forEach(id=>selected.add(id));Object.keys(mix).forEach(id=>delete mix[id]);Object.assign(mix,Object.fromEntries(Object.entries(state.mix).map(([id,choice])=>[id,{...choice}])));Object.keys(resourceChoices).forEach(id=>delete resourceChoices[id]);Object.assign(resourceChoices,Object.fromEntries(Object.entries(state.resourceChoices).map(([id,choice])=>[id,{...choice}])));
    for(const [id,value] of [['helper-task',state.task],['helper-deliverable',state.deliverable],['helper-exclusions',state.exclusions],['helper-experience',state.experience],['helper-mode',state.mode],['approach',state.approach],['depth',state.depth],['voice',state.voice],['creative-nudge',state.nudge]])byId(id).value=value;
    experienceLabels();render();tailoring.invalidate();
    results=buildHelpers(config,{...state,base:baseUrl()});results.forEach((result,index)=>{result.text=snapshot.drafts[index].text;});resultWorkspace=state;renderResults();renderRevisions();
  }
  function variantFromDraft(name,id=newVariantId()){
    return validateVariant({format:variantFormat,version:variantVersion,edition:config.edition.id,id,name,savedAt:new Date().toISOString(),workspace:resultWorkspace,drafts:results.map(r=>({text:r.text}))},config);
  }
  function persistVariants(){
    if(blockedVariantBundle)throw new Error('Export and reset the unreadable browser library before saving.');
    try{localStorage.setItem(variantStorageKey,JSON.stringify({format:'skillforge-variants',version:variantVersion,edition:config.edition.id,variants:[...savedVariants,...unavailableVariants]}));return true;}
    catch(_){byId('variant-storage-note').textContent='Browser storage is unavailable. Variants stay in this tab; export a file to keep them.';return false;}
  }
  function renderVariants(choose){
    const picker=byId('variant-picker');picker.replaceChildren();const first=element('option','Choose a saved variant');first.value='';picker.append(first);
    savedVariants.sort((a,b)=>b.savedAt.localeCompare(a.savedAt));savedVariants.forEach(v=>{const option=element('option',v.name);option.value=v.id;picker.append(option);});
    picker.value=choose&&savedVariants.some(v=>v.id===choose)?choose:'';
    byId('variant-name').value=savedVariants.find(v=>v.id===picker.value)?.name||'';
    byId('save-variant').textContent=picker.value&&picker.value===activeVariantId?'Save changes':'Save variant';
    for(const id of ['open-variant','duplicate-variant','export-variant','delete-variant'])byId(id).disabled=!picker.value;
  }
  function loadVariants(){
    let raw;
    try{raw=localStorage.getItem(variantStorageKey);}catch(_){byId('variant-storage-note').textContent='Browser storage is unavailable. Variants stay in this tab; export a file to keep them.';return;}
    if(!raw)return;
    try{
      const bundle=JSON.parse(raw);
      if(bundle.format!=='skillforge-variants'||bundle.version!==variantVersion||bundle.edition!==config.edition.id||!Array.isArray(bundle.variants)||bundle.variants.length>100)throw new Error('Saved variants could not be read. Export any current draft before saving again.');
      const seen=new Set();
      for(const item of bundle.variants){
        try{const variant=validateVariant(item,config);if(seen.has(variant.id))throw new Error('Duplicate variant ID.');seen.add(variant.id);savedVariants.push(variant);}
        catch(_){unavailableVariants.push(item);}
      }
      if(unavailableVariants.length){byId('variant-storage-note').textContent=unavailableVariants.length+' older variant(s) cannot open with this catalog. They remain stored; export a recovery file before removing browser data.';byId('export-variant-recovery').hidden=false;}
    }catch(_){
      blockedVariantBundle=raw;byId('variant-storage-note').textContent='Saved variants could not be read. Export the original data, then reset this browser library to save again.';
      byId('export-variant-recovery').hidden=false;byId('reset-variant-storage').hidden=false;
    }
  }
  function chosenVariant(){return savedVariants.find(v=>v.id===byId('variant-picker').value);}
  function libraryFull(){return savedVariants.length>=30||savedVariants.length+unavailableVariants.length>=100;}
  function sameName(left,right){return left.trim().toLowerCase()===right.trim().toLowerCase();}
  byId('variant-picker').addEventListener('change',()=>{if(byId('variant-picker').value!==activeVariantId)activeVariantId='';renderVariants(byId('variant-picker').value);});
  byId('save-variant').addEventListener('click',()=>{
    try{
      if(blockedVariantBundle)throw new Error('Export and reset the unreadable browser library before saving.');
      const name=byId('variant-name').value.trim();if(!name)throw new Error('Name this variant first.');
      const active=savedVariants.find(v=>v.id===activeVariantId&&v.id===byId('variant-picker').value);
      if(savedVariants.some(v=>v.id!==active?.id&&sameName(v.name,name)))throw new Error('That name is already saved. Open that variant to update it, or choose another name.');
      if(!active&&libraryFull())throw new Error('Browser library is full. Export or delete a variant first.');
      const variant=variantFromDraft(name,active?.id);if(active)savedVariants.splice(savedVariants.indexOf(active),1);
      savedVariants.push(variant);activeVariantId=variant.id;const stored=persistVariants();renderVariants(variant.id);byId('helper-status').textContent=stored?'Variant saved in this browser.':'Variant kept for this tab. Export it to keep it.';
    }catch(error){byId('helper-status').textContent=error.message;}
  });
  byId('open-variant').addEventListener('click',()=>{
    try{const variant=chosenVariant();if(!variant)return;archiveResults();restoreSnapshot(variant);activeVariantId=variant.id;renderVariants(variant.id);byId('variant-name').value=variant.name;byId('helper-status').textContent='Variant opened. Edit the draft and save again when ready.';byId('output-heading').scrollIntoView({block:'start'});}
    catch(error){byId('helper-status').textContent=error.message;}
  });
  byId('duplicate-variant').addEventListener('click',()=>{
    try{const source=chosenVariant();if(!source)return;if(blockedVariantBundle)throw new Error('Export and reset the unreadable browser library before saving.');if(libraryFull())throw new Error('Browser library is full. Export or delete a variant first.');
      let name=(source.name.slice(0,74)+' copy'),number=2;while(savedVariants.some(v=>sameName(v.name,name))){name=source.name.slice(0,70)+' copy '+number++;}
      const copy=validateVariant({...source,id:newVariantId(),name,savedAt:new Date().toISOString()},config);savedVariants.push(copy);const stored=persistVariants();activeVariantId=copy.id;renderVariants(copy.id);archiveResults();restoreSnapshot(copy);byId('variant-name').value=copy.name;byId('helper-status').textContent=stored?'Variant duplicated and opened.':'Copy kept for this tab. Export it to keep it.';
    }catch(error){byId('helper-status').textContent=error.message;}
  });
  byId('delete-variant').addEventListener('click',()=>{const variant=chosenVariant();if(!variant)return;savedVariants=savedVariants.filter(v=>v.id!==variant.id);if(activeVariantId===variant.id)activeVariantId='';persistVariants();renderVariants('');byId('helper-status').textContent='Saved variant removed. Your current draft is unchanged.';});
  byId('export-variant').addEventListener('click',()=>{const variant=chosenVariant();if(!variant)return;download(JSON.stringify(variant,null,2)+'\n','application/json;charset=utf-8','skillforge-'+variant.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)+'.json');byId('helper-status').textContent='Variant exported.';});
  byId('export-variant-recovery').addEventListener('click',()=>{
    if(blockedVariantBundle){download(blockedVariantBundle,'text/plain;charset=utf-8','skillforge-browser-library-recovery.txt');recoveryExported=true;byId('reset-variant-storage').disabled=false;byId('helper-status').textContent='Original browser data exported. You can now reset this library.';return;}
    download(JSON.stringify({format:'skillforge-variants',version:variantVersion,edition:config.edition.id,variants:unavailableVariants},null,2)+'\n','application/json;charset=utf-8','skillforge-unavailable-variants.json');byId('helper-status').textContent='Unavailable variant data exported for recovery.';
  });
  byId('reset-variant-storage').addEventListener('click',()=>{
    if(!blockedVariantBundle||!recoveryExported)return;
    try{localStorage.removeItem(variantStorageKey);blockedVariantBundle='';recoveryExported=false;byId('reset-variant-storage').hidden=true;byId('reset-variant-storage').disabled=true;byId('export-variant-recovery').hidden=true;byId('variant-storage-note').textContent='Browser library reset. Your current draft is unchanged.';byId('helper-status').textContent='Browser library reset. Build, save or import a variant.';}
    catch(_){byId('helper-status').textContent='Could not reset browser storage. Your exported recovery file is unchanged.';}
  });
  byId('import-variant').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(blockedVariantBundle)throw new Error('Export and reset the unreadable browser library before importing.');
      if(file.size>1000000)throw new Error('Variant file is too large.');if(libraryFull())throw new Error('Browser library is full. Export or delete a variant first.');
      const imported=validateVariant(JSON.parse(await file.text()),config);let name=imported.name,number=2;while(savedVariants.some(v=>sameName(v.name,name)))name=imported.name.slice(0,70)+' '+number++;
      const variant={...imported,id:newVariantId(),name,savedAt:new Date().toISOString()};savedVariants.push(variant);const stored=persistVariants();renderVariants(variant.id);byId('helper-status').textContent=stored?'Variant imported. Choose Open to load it.':'Variant imported for this tab. Export it to keep it.';
    }catch(error){byId('helper-status').textContent=error.message||'Could not import that variant.';}
    finally{event.target.value='';}
  });
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
    event.preventDefault();tailoring.invalidate();
    try{
      const state=workspaceState(),next=buildHelpers(config,{...state,base:baseUrl()});
      archiveResults();results=next;resultWorkspace=state;renderResults();
      byId('catalog-panel').open=false;byId('output-heading').focus();byId('output-heading').scrollIntoView({block:'start'});
      byId("helper-status").textContent=results.length===1?(results[0].purpose==='helper'?"Helper setup ready. Edit or copy it.":"Work brief ready. Edit or copy it."):results.length+" prompts ready. AI tailoring requires one combined prompt.";
    }catch(error){byId("helper-status").textContent=error.message;}
  });
  byId("download-helpers").addEventListener("click",()=>{
    const content=results.map((r,i)=>"<!-- Prompt "+(i+1)+": "+r.title+" -->\n"+r.text).join("\n\n====================\n\n");
    download(content,'text/markdown;charset=utf-8','my-helpers.md');
  });
  window.addEventListener('popstate',()=>{const item=Brief.readItem(config,location.search,config.internal);if(item)revealItem(item.target,item.useCase?.id,false);else{revealed=null;render();}});
  experienceLabels();
  const initial=Brief.readItem(config,location.search,config.internal);
  if(initial)revealItem(initial.target,initial.useCase?.id,false);else render();
  loadVariants();renderVariants('');renderRevisions();renderResults();
}());
