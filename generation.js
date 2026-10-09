/* Optional same-origin AI connection. Never stores credentials or draft text. */
(function(root){
  'use strict';
  function validateResult(value,resources){
    if(!value||typeof value.brief!=='string'||!value.brief.trim()||value.brief.length>30000)throw new Error('The model returned no usable brief. Your local prompt is still available.');
    if(!Array.isArray(value.capability_ids)||value.capability_ids.some(id=>!resources.some(r=>r.id===id)))throw new Error('The model named an unavailable capability. Keep the local prompt and try again.');
    return value;
  }
  function attach(prefix,getBrief,getResources,getPurpose=()=> 'work'){
    const by=id=>document.getElementById(prefix+'-'+id);
    let revision=0,controller=null,connection=null;
    function invalidate(){revision++;if(controller)controller.abort();controller=null;by('ai-output').value='';by('ai-copy').disabled=true;by('ai-status').textContent='';by('cancel').hidden=true;by('generate').disabled=!connection;}
    by('connect').addEventListener('click',async()=>{
      if(!/^https?:$/.test(location.protocol)){by('connection').textContent='This offline copy has no AI connection. You can use the prompt with your assistant, or open a host-configured version.';return;}
      try{
        const response=await fetch('/api/brief/connection',{cache:'no-store',signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw new Error('No AI connection is configured on this host. The local builder still works.');
        const data=await response.json();
        if(data.configured!==true||typeof data.label!=='string')throw new Error('This host has no configured model. The local builder still works.');
        connection=data;by('connection').textContent='Destination: '+data.label+'. Clicking Tailor with AI sends the displayed prompt, your direction and the listed resource descriptions to this connection. Its data-handling rules apply.';by('generate').disabled=false;
      }catch(error){connection=null;by('generate').disabled=true;by('connection').textContent=error.message||'No usable AI connection. The local prompt is still available.';}
    });
    by('direction').addEventListener('input',invalidate);
    by('cancel').addEventListener('click',()=>{invalidate();by('ai-status').textContent='Stopped waiting. A model request already received by the server may still finish.';});
    by('generate').addEventListener('click',async()=>{
      const brief=getBrief(),resources=getResources();
      if(!brief){by('ai-status').textContent='Build one combined prompt first so you can review what will be sent.';return;}
      invalidate();const current=revision;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),60000);
      by('generate').disabled=true;by('cancel').hidden=false;by('ai-status').textContent='Developing a tailored prompt…';
      try{
        const response=await fetch('/api/brief/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief,purpose:getPurpose(),direction:by('direction').value,capabilities:resources.map(({id,title,kind,why,status,briefing})=>({id,title,kind,why,status,briefing}))}),signal:controller.signal});
        if(current!==revision)return;
        if(!response.ok)throw new Error('AI tailoring failed ('+response.status+'). Your local prompt is still available.');
        const value=validateResult(await response.json(),resources);if(current!==revision)return;
        const selected=value.capability_ids.map(id=>resources.find(r=>r.id===id));
        by('ai-output').value=value.brief+(selected.length?'\n\nReferenced capabilities\n'+selected.map(r=>'- '+r.title+': '+r.url+'\n  '+r.status).join('\n'):'');
        by('ai-copy').disabled=false;by('ai-status').textContent='AI-tailored draft. Check its assumptions before using it; no linked skill has been installed or run.';
      }catch(error){if(current===revision)by('ai-status').textContent=error.name==='AbortError'?'The request timed out. Your local prompt is still available.':error.message;}
      finally{clearTimeout(timeout);if(current===revision){controller=null;by('cancel').hidden=true;by('generate').disabled=!connection;}}
    });
    by('ai-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(by('ai-output').value);by('ai-status').textContent='Tailored prompt copied.';}catch(_){by('ai-output').focus();by('ai-output').select();by('ai-status').textContent='Text selected. Use your usual Copy command.';}});
    return {invalidate};
  }
  const api={attach,validateResult};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BriefGeneration=api;
}(typeof globalThis!=='undefined'?globalThis:this));
