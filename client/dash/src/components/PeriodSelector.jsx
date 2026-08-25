import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

const MONTHS=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const TYPES=[['month','Mensual'],['bimonth','Bimestral'],['quarter','Trimestral'],['semester','Semestral'],['year','Anual']];
function optionsFor(type){if(type==='month')return MONTHS.map((m,i)=>({value:i+1,label:m}));if(type==='bimonth')return Array.from({length:6},(_,i)=>({value:i+1,label:`${MONTHS[i*2]}-${MONTHS[i*2+1]}`}));if(type==='quarter')return Array.from({length:4},(_,i)=>({value:i+1,label:`Q${i+1}`}));if(type==='semester')return [{value:1,label:'S1'},{value:2,label:'S2'}];return [{value:1,label:'Año completo'}];}

export default function PeriodSelector({type,index,year,label,years=[],onChange}){
  const [open,setOpen]=useState(false); const ref=useRef(null); const choices=useMemo(()=>optionsFor(type),[type]);
  useEffect(()=>{function close(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false)}document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
  const changeType=(next)=>{const nextChoices=optionsFor(next);onChange({type:next,index:nextChoices.some(x=>x.value===index)?index:1,year});};
  return <div className="periodControl" ref={ref}>
    <button type="button" className={open?'periodTrigger open':'periodTrigger'} onClick={()=>setOpen(!open)}>
      <span className="periodTriggerIcon"><CalendarDays size={17}/></span><span className="periodTriggerCopy"><small>Periodo de análisis</small><b>{label||'Periodo'}</b></span><ChevronDown className={open?'periodChevron open':''} size={16}/>
    </button>
    {open&&<div className="periodPopover"><div className="periodPopoverHeader"><span><CalendarDays size={17}/></span><div><b>Periodo de análisis</b><small>Define la ventana que quieres revisar</small></div></div><div className="periodFields">
      <label><span>Vista</span><select value={type} onChange={e=>changeType(e.target.value)}>{TYPES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
      <label><span>Periodo</span><select value={index} onChange={e=>onChange({type,index:Number(e.target.value),year})}>{choices.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select></label>
      <label><span>Año</span><select value={year} onChange={e=>onChange({type,index,year:Number(e.target.value)})}>{years.map(y=><option value={y} key={y}>{y}</option>)}</select></label>
    </div><button type="button" className="applyPeriod" onClick={()=>setOpen(false)}>Aplicar periodo</button></div>}
  </div>;
}
