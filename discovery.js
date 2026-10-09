/* Pure catalog presentation. No model, storage or network access. */
(function(root){
  'use strict';
  const kinds=['role','expertise','resource','context'];
  const names={role:'Skills',expertise:'Perspectives',resource:'References',context:'Guidance'};
  const icons={role:'spark',expertise:'compass',resource:'file',context:'globe'};
  const alpha=(a,b)=>a.localeCompare(b,'en',{sensitivity:'base'});
  const rank=(value,order)=>order.includes(value)?order.indexOf(value):order.length;
  const key=(topic,p)=>p.topicAliases[topic]||topic;
  const label=(item,p)=>p.compactTitles[item.id]||item.title;
  const topicLabel=(topic,p)=>p.topics[key(topic,p)]?.title||topic;
  const inTopic=(item,topic,p)=>item.topics.some(value=>key(value,p)===key(topic,p));
  function items(config){
    const entries=config.entries.map(e=>({id:'entry:'+e.id,kind:e.kind,title:e.title,topics:[e.category||'Guidance'],source:e}));
    const categories=new Map(config.entries.map(e=>[e.id,e.category]));
    const resources=(config.capabilities||[]).filter(e=>config.internal||e.audience==='public').map(e=>({id:'resource:'+e.id,kind:'resource',title:e.title,topics:[...new Set(e.for_ids.map(id=>categories.get(id)).filter(Boolean))].sort(),source:e}));
    return [...entries,...resources];
  }
  function group(items,mode,p,scope=''){
    const groups=new Map();
    for(const item of items){
      const id=mode==='kind'?item.kind:mode==='alphabetical'?label(item,p)[0]?.toLocaleUpperCase()||'#':scope&&inTopic(item,scope,p)?key(scope,p):key(item.topics[0]||'Other',p);
      if(!groups.has(id))groups.set(id,{key:id,title:mode==='kind'?names[id]||id:mode==='topic'?topicLabel(id,p):id,icon:mode==='kind'?icons[id]:mode==='topic'?p.topics[id]?.icon:undefined,items:[]});
      groups.get(id).items.push(item);
    }
    const order=mode==='topic'?Object.keys(p.topics):mode==='kind'?kinds:[];
    return [...groups.values()].sort((a,b)=>rank(a.key,order)-rank(b.key,order)||alpha(a.title,b.title)).map(g=>{
      const sorted=[...g.items].sort((a,b)=>(mode==='alphabetical'?0:rank(a.kind,kinds)-rank(b.kind,kinds))||alpha(label(a,p),label(b,p))||alpha(a.id,b.id));
      const children=mode==='kind'?group(sorted,'topic',p,scope):undefined;
      return {...g,items:sorted,children:children&&children.length>1?children:undefined};
    });
  }
  function browse(items,mode,p,scope=''){
    const groups=group(items,mode,p,scope);
    if(mode!=='topic')return groups.flatMap(g=>g.items);
    const result=[];
    for(let i=0;i<Math.max(0,...groups.map(g=>g.items.length));i++)for(const g of groups)if(g.items[i])result.push(g.items[i]);
    return result;
  }
  const api={items,label,topicLabel,inTopic,group,browse,names};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatalogDiscovery=api;
}(typeof globalThis!=='undefined'?globalThis:this));
