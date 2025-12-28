
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Person, Expense, Balance, Group } from './types';
import { getFinancialInsights } from './services/geminiService';
import { 
  PlusIcon, 
  TrashIcon, 
  ChartBarIcon, 
  ReceiptRefundIcon, 
  SparklesIcon,
  BanknotesIcon,
  UserPlusIcon,
  PencilSquareIcon,
  FolderIcon,
  ChevronLeftIcon,
  Bars3Icon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowPathRoundedSquareIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const CATEGORY_STYLES: Record<string, string> = {
  Food: 'bg-rose-600 text-white border-rose-700 shadow-md',
  Transport: 'bg-sky-600 text-white border-sky-700 shadow-md',
  Housing: 'bg-amber-600 text-white border-amber-700 shadow-md',
  Entertainment: 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-md',
  Other: 'bg-slate-700 text-white border-slate-800 shadow-md',
};

const INITIAL_PEOPLE: Person[] = [
  { id: '1', name: 'Alex', avatar: 'https://picsum.photos/seed/alex/100' },
  { id: '2', name: 'Blake', avatar: 'https://picsum.photos/seed/blake/100' },
];

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const activeGroup = useMemo(() => 
    groups.find(g => g.id === activeGroupId) || null
  , [groups, activeGroupId]);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Food');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState('');

  const createDefaultGroup = useCallback((): Group => ({
    id: `default-${Date.now()}`,
    name: 'Main Squad',
    people: INITIAL_PEOPLE,
    expenses: [],
    createdAt: new Date().toISOString()
  }), []);

  useEffect(() => {
    const saved = localStorage.getItem('pentsplit_vault');
    if (saved) {
      try {
        const parsedGroups = JSON.parse(saved);
        if (Array.isArray(parsedGroups) && parsedGroups.length > 0) {
          setGroups(parsedGroups);
          setActiveGroupId(parsedGroups[0].id);
        } else {
          const def = createDefaultGroup();
          setGroups([def]);
          setActiveGroupId(def.id);
        }
      } catch (e) {
        const def = createDefaultGroup();
        setGroups([def]);
        setActiveGroupId(def.id);
      }
    } else {
      const def = createDefaultGroup();
      setGroups([def]);
      setActiveGroupId(def.id);
    }
  }, [createDefaultGroup]);

  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem('pentsplit_vault', JSON.stringify(groups));
    }
  }, [groups]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeGroup && activeGroup.people.length > 0) {
      setPaidBy(activeGroup.people[0].id);
      setInsights(null); // Clear insights when switching groups
    }
  }, [activeGroupId]);

  const handleGenerateInsights = async () => {
    if (!activeGroup || activeGroup.expenses.length === 0) return;
    setIsGeneratingInsights(true);
    try {
      const result = await getFinancialInsights(activeGroup.expenses, activeGroup.people);
      setInsights(result || "No specific patterns detected yet.");
    } catch (error) {
      setInsights("Unable to reach AI auditor. Check your connection.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const updateGroups = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const createGroup = () => {
    const name = prompt("Enter Group Name:");
    if (!name) return;
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      people: INITIAL_PEOPLE,
      expenses: [],
      createdAt: new Date().toISOString()
    };
    setGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this group?")) return;
    const newGroups = groups.filter(g => g.id !== id);
    setGroups(newGroups);
    if (activeGroupId === id) setActiveGroupId(newGroups.length > 0 ? newGroups[0].id : null);
  };

  const balances = useMemo(() => {
    if (!activeGroup) return [];
    const total = activeGroup.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const sharePerPerson = activeGroup.people.length > 0 ? total / activeGroup.people.length : 0;
    return activeGroup.people.map(person => {
      const paid = activeGroup.expenses.filter(e => e.paidById === person.id).reduce((acc, curr) => acc + curr.amount, 0);
      return { personId: person.id, paid, share: sharePerPerson, net: paid - sharePerPerson };
    });
  }, [activeGroup]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  if (!activeGroup && groups.length === 0) {
     return (
       <div className="h-screen flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="text-center animate-in fade-in zoom-in duration-500">
             <FolderIcon className="h-20 w-20 mx-auto mb-6 text-indigo-500" />
             <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">No Vaults Found</h1>
             <button onClick={createGroup} className="bg-indigo-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/20 active:scale-95">
                Create First Sync
             </button>
          </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 lg:relative z-[60] h-full bg-slate-900 text-white transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0 w-80 lg:w-20'} flex flex-col overflow-hidden shadow-2xl`}>
         <div className="p-6 flex items-center justify-between border-b border-white/5 shrink-0">
            {(isSidebarOpen || window.innerWidth >= 1024) && <h2 className="text-xl font-black uppercase tracking-widest text-indigo-400">SplitSync</h2>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
               {isSidebarOpen ? <XMarkIcon className="h-6 w-6 lg:hidden" /> : <Bars3Icon className="h-6 w-6 lg:hidden" />}
               <ChevronLeftIcon className={`h-6 w-6 hidden lg:block transition-transform ${!isSidebarOpen && 'rotate-180'}`} />
            </button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {groups.map(g => (
              <div key={g.id} onClick={() => { setActiveGroupId(g.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2 ${activeGroupId === g.id ? 'bg-indigo-600 border-indigo-400 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                 <div className="flex items-center gap-3 truncate">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black shrink-0 ${activeGroupId === g.id ? 'bg-white text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'}`}>{g.name.charAt(0).toUpperCase()}</div>
                    {isSidebarOpen && <div className="truncate"><p className="font-black uppercase tracking-tighter text-sm truncate">{g.name}</p><p className={`text-[10px] font-black uppercase tracking-widest ${activeGroupId === g.id ? 'text-white/60' : 'text-slate-500'}`}>{g.people.length} Members</p></div>}
                 </div>
                 {isSidebarOpen && <button onClick={(e) => deleteGroup(g.id, e)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-all"><TrashIcon className="h-4 w-4" /></button>}
              </div>
            ))}
            <button onClick={createGroup} className={`w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-white/20 rounded-2xl hover:border-indigo-500 hover:text-indigo-400 transition-all ${!isSidebarOpen && 'p-2'}`}><PlusIcon className="h-6 w-6" />{isSidebarOpen && <span className="font-black uppercase tracking-widest text-xs">New Squad</span>}</button>
         </div>
      </aside>

      <div className="flex-1 h-screen overflow-y-auto relative flex flex-col scroll-smooth">
        <div className="lg:hidden bg-indigo-700 text-white p-4 flex items-center justify-between sticky top-0 z-[50] shadow-lg">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/10 rounded-lg active:scale-90 transition-transform"><Bars3Icon className="h-6 w-6" /></button>
          <span className="font-black uppercase tracking-widest text-sm truncate px-4">{activeGroup?.name}</span>
          <div className="w-10" />
        </div>

        <header className="bg-indigo-700 text-white py-8 md:py-12 px-4 md:px-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl">
                <SparklesIcon className="h-10 w-10 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">{activeGroup?.name || 'SplitSync'}</h1>
                <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mt-2">{activeGroup?.people.length || 0} ACTIVE MEMBERS</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-8 bg-black/20 px-6 py-4 rounded-[32px] backdrop-blur-xl border border-white/10 w-full md:w-auto justify-center shadow-inner">
              <div className="text-center md:text-right">
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Pool</p>
                <p className="text-2xl md:text-3xl font-black tracking-tighter leading-none">{formatCurrency(balances.reduce((a, b) => a + b.paid, 0))}</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center md:text-right">
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Split</p>
                <p className="text-2xl md:text-3xl font-black tracking-tighter leading-none">
                  {formatCurrency(activeGroup && activeGroup.people.length > 0 ? (balances.reduce((a, b) => a + b.paid, 0) / activeGroup.people.length) : 0)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          <div className="lg:col-span-7 space-y-8">
            {/* AI Insights Card */}
            <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-8 shadow-2xl text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <LightBulbIcon className="h-40 w-40" />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-400/20">
                    <SparklesIcon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-widest">AI Financial Audit</h2>
                </div>
                <button 
                  onClick={handleGenerateInsights}
                  disabled={isGeneratingInsights || activeGroup.expenses.length === 0}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  {isGeneratingInsights ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <LightBulbIcon className="h-4 w-4" />}
                  {isGeneratingInsights ? 'Auditing...' : 'Generate Insight'}
                </button>
              </div>
              
              <div className="relative z-10">
                {insights ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm leading-relaxed text-indigo-100 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="prose prose-invert max-w-none prose-sm">
                      {insights.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                    </div>
                  </div>
                ) : (
                  <div className="text-indigo-300/40 text-xs font-bold uppercase tracking-widest text-center py-8 border-2 border-dashed border-indigo-500/20 rounded-2xl">
                    Tap the button above for an AI-powered spend audit.
                  </div>
                )}
              </div>
            </section>

            {/* Members & Spend Form (keeping same logic but ensuring mobile touch area) */}
            <section className="bg-slate-900 rounded-[32px] p-8 shadow-xl text-white">
               <div className="flex items-center gap-3 mb-6">
                 <div className="bg-white/10 p-2 rounded-xl"><UserPlusIcon className="h-6 w-6 text-indigo-400" /></div>
                 <h2 className="text-xl font-black uppercase tracking-tight">Members</h2>
               </div>
               <div className="flex gap-3 mb-8">
                 <input type="text" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPerson()} placeholder="Add Person..." className="flex-1 bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 font-bold text-white outline-none focus:border-indigo-500 transition-all" />
                 <button onClick={addPerson} className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl transition-all active:scale-90"><PlusIcon className="h-6 w-6 font-black" /></button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeGroup?.people.map(person => (
                    <div key={person.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl group/item">
                       <div className="flex items-center gap-3">
                         <img src={person.avatar} className="h-10 w-10 rounded-xl shadow-md border border-white/10" alt="" />
                         {editingPersonId === person.id ? (
                           <input autoFocus defaultValue={person.name} onBlur={(e) => updatePersonName(person.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updatePersonName(person.id, e.currentTarget.value)} className="bg-slate-800 border-b-2 border-indigo-500 text-white px-2 py-1 font-black uppercase outline-none w-24 text-sm" />
                         ) : (
                           <span className="font-black uppercase tracking-tighter text-slate-200 truncate max-w-[100px] text-sm">{person.name}</span>
                         )}
                       </div>
                       <div className="flex gap-2 group-hover/item:opacity-100 transition-opacity">
                         <button onClick={() => setEditingPersonId(person.id)} className="p-2 hover:bg-white/10 rounded-lg text-indigo-400"><PencilSquareIcon className="h-4 w-4" /></button>
                         <button onClick={() => removePerson(person.id)} className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-500"><TrashIcon className="h-4 w-4" /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <section className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-indigo-600 p-2 rounded-xl text-white"><PlusIcon className="h-6 w-6" /></div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">New Spend</h2>
              </div>
              <form onSubmit={addExpense} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Description</label>
                  <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-lg" />
                </div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total (₹)</label><input type="number" required step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-black text-xl text-indigo-600" /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Who Paid?</label><select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 border-black focus:border-indigo-500 outline-none appearance-none bg-black text-white font-black uppercase tracking-tighter text-base">{activeGroup?.people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label><select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-6 py-4 rounded-2xl border-2 border-black focus:border-indigo-500 outline-none appearance-none bg-black text-white font-bold uppercase tracking-tighter text-base"><option value="Food">Food</option><option value="Transport">Transport</option><option value="Housing">Housing</option><option value="Entertainment">Entertainment</option><option value="Other">Other</option></select></div>
                <div className="flex items-end"><button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg uppercase tracking-widest"><BanknotesIcon className="h-6 w-6" />Sync Entry</button></div>
              </form>
            </section>

            <section className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/80 gap-4">
                <div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-xl text-indigo-700"><ReceiptRefundIcon className="h-6 w-6" /></div><h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Timeline</h2></div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button onClick={exportToCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100"><ArrowDownTrayIcon className="h-4 w-4" />Export</button>
                  <button onClick={() => { if(confirm("Clear history?")) updateGroups({...activeGroup, expenses: []}) }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100 sm:border-transparent"><ArrowPathIcon className="h-4 w-4" />Clear</button>
                  <span className="hidden sm:block bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">{activeGroup?.expenses.length || 0} ITEMS</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto scrollbar-hide">
                {activeGroup?.expenses.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-sm">No spend history.</div>
                ) : (
                  activeGroup?.expenses.map(expense => {
                    const person = activeGroup.people.find(p => p.id === expense.paidById);
                    return (
                      <div key={expense.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-indigo-50/40 transition-all group gap-6 border-l-[12px] border-l-transparent hover:border-l-indigo-600">
                        <div className="flex items-center gap-6">
                          <img src={person?.avatar} className="h-14 w-14 rounded-xl border-4 border-white shadow-lg object-cover shrink-0" alt="" />
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-xl tracking-tight leading-none truncate group-hover:text-indigo-900">{expense.description}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2"><span className="px-2 py-0.5 bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest rounded-md">By {person?.name}</span><span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{new Date(expense.date).toLocaleDateString()}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-10 border-t border-slate-50 md:border-none pt-4 md:pt-0">
                          <div className="text-left md:text-right"><p className="font-black text-slate-900 text-2xl tracking-tighter">{formatCurrency(expense.amount)}</p><span className={`text-[11px] font-black uppercase tracking-widest ${CATEGORY_STYLES[expense.category] || CATEGORY_STYLES.Other} px-3 py-1 rounded-lg inline-block mt-1`}>{expense.category}</span></div>
                          <button onClick={() => removeExpense(expense.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><TrashIcon className="h-6 w-6" /></button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <section className="bg-slate-900 rounded-[32px] p-8 shadow-2xl text-white relative overflow-hidden">
              <div className="absolute bottom-0 right-0 -mb-20 -mr-20 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3"><ChartBarIcon className="h-6 w-6 text-indigo-400" /><h2 className="text-xl font-black uppercase tracking-[0.2em] text-indigo-300">Settlements</h2></div>
              </div>
              <div className="space-y-4 relative z-10">
                {balances.map(balance => {
                  const person = activeGroup?.people.find(p => p.id === balance.personId);
                  const isOwed = balance.net > 0;
                  const absNet = Math.abs(balance.net);
                  return (
                    <div key={balance.personId} className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4 truncate"><img src={person?.avatar} className="h-12 w-12 rounded-xl shrink-0 shadow-lg" alt="" /><span className="font-black uppercase tracking-tighter text-lg truncate">{person?.name}</span></div>
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-black tracking-tighter ${absNet < 0.01 ? 'text-slate-500' : (isOwed ? 'text-emerald-400' : 'text-rose-400')}`}>{absNet < 0.01 ? 'Settled' : (isOwed ? `+ ${formatCurrency(balance.net)}` : `- ${formatCurrency(absNet)}`)}</p>
                        <p className="text-[9px] uppercase font-black tracking-widest opacity-40">{absNet < 0.01 ? 'Balance ₹0.00' : (isOwed ? 'OWED' : 'OWES')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount || !activeGroup) return;
    const newExpense: Expense = { id: Date.now().toString(), description, amount: parseFloat(amount), paidById: paidBy, date: new Date().toISOString(), category };
    updateGroups({...activeGroup, expenses: [newExpense, ...activeGroup.expenses]});
    setDescription(''); setAmount('');
  }

  function removeExpense(id: string) {
    if (!activeGroup) return;
    updateGroups({...activeGroup, expenses: activeGroup.expenses.filter(e => e.id !== id)});
  }

  function addPerson() {
    if (!newPersonName.trim() || !activeGroup) return;
    const newPerson: Person = { id: Date.now().toString(), name: newPersonName.trim(), avatar: `https://picsum.photos/seed/${newPersonName.trim().toLowerCase()}/100` };
    updateGroups({...activeGroup, people: [...activeGroup.people, newPerson]});
    setNewPersonName('');
  }

  function updatePersonName(id: string, name: string) {
    if (!activeGroup) return;
    updateGroups({...activeGroup, people: activeGroup.people.map(p => p.id === id ? {...p, name} : p)});
    setEditingPersonId(null);
  }

  function removePerson(id: string) {
    if (!activeGroup || activeGroup.people.length <= 1) return;
    updateGroups({...activeGroup, people: activeGroup.people.filter(p => p.id !== id), expenses: activeGroup.expenses.filter(e => e.paidById !== id)});
  }

  function exportToCSV() {
    if (!activeGroup || activeGroup.expenses.length === 0) return;
    const headers = ["Date", "Description", "Category", "Paid By", "Amount (INR)"];
    const rows = activeGroup.expenses.map(e => [`"${new Date(e.date).toLocaleDateString()}"`, `"${e.description}"`, `"${e.category}"`, `"${activeGroup.people.find(p => p.id === e.paidById)?.name}"`, e.amount.toFixed(2)]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SplitSync_Report_${activeGroup.name}.csv`;
    link.click();
  }
};

export default App;
