import { useState, useRef, useEffect } from "react";

const PHASE_1_TARGET = 3;
const PHASE_2_TARGET = 3;
const STEP_2_TARGET = 3;
const STEP_3_TARGET = 3;
const TOTAL_MASTERY = 3;

const STEP_LABELS = { 0: "Beginner", 1: "Professional", 2: "Legend" };
const STEP_COLORS = { 0: "#2563eb", 1: "#8b5cf6", 2: "#f59e0b" };
const STEP_BG_LIGHT = {
  0: "linear-gradient(135deg, #eff6ff, #e0ecff)",
  1: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
  2: "linear-gradient(135deg, #fffbeb, #fef3c7)"
};
const STEP_BG_DARK = {
  0: "linear-gradient(135deg, #1e2a4a, #1e3a5f)",
  1: "linear-gradient(135deg, #2d2248, #3b2d5e)",
  2: "linear-gradient(135deg, #3d3520, #4a3f1a)"
};
const STEP_BORDER_LIGHT = { 0: "#bfdbfe", 1: "#c4b5fd", 2: "#fde68a" };
const STEP_BORDER_DARK = { 0: "#2563eb", 1: "#7c3aed", 2: "#d97706" };

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function TrixbiLogo() {
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
  const letters = "TRIXBI".split("");
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {letters.map((l, i) => (
        <div key={i} style={{
          width: 38, height: 42, background: colors[i % colors.length],
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 24, fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)", transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1 + i * 0.5)}deg)`
        }}>{l}</div>
      ))}
    </div>
  );
}

function MasteryDots({ mastery = 0 }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", marginRight: 4 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          border: "1.5px solid",
          borderColor: i < mastery ? "#22c55e" : "#d1d5db",
          background: i < mastery ? "#22c55e" : "transparent",
          transition: "all 0.3s ease"
        }} />
      ))}
    </div>
  );
}

export default function LanguageTrainer() {
  const [mode, setMode] = useState("input");
  const [theme, setTheme] = useState(() => localStorage.getItem("tx-theme") || "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pairs, setPairs] = useState(() => {
    const saved = localStorage.getItem("tx-pairs");
    if (!saved) return [];
    const parsedPairs = JSON.parse(saved);
    const savedSets = localStorage.getItem("tx-sets");
    if (!savedSets) return parsedPairs;
    const parsedSets = JSON.parse(savedSets);
    const knownSetIds = new Set(parsedSets.map(s => s.id));
    if (parsedPairs.every(p => knownSetIds.has(p.setId))) return parsedPairs;
    const defaultSetId = parsedSets[0]?.id || "";
    return parsedPairs.map(p => knownSetIds.has(p.setId) ? p : { ...p, setId: defaultSetId });
  });
  const [learned, setLearned] = useState(() => {
    const saved = localStorage.getItem("tx-learned");
    return saved ? JSON.parse(saved) : [];
  });
  const [sets, setSets] = useState(() => {
    const saved = localStorage.getItem("tx-sets");
    if (saved) return JSON.parse(saved);
    const initial = [{ id: generateId(), name: "General" }];
    localStorage.setItem("tx-sets", JSON.stringify(initial));
    return initial;
  });
  const [mastery, setMastery] = useState(() => {
    const saved = localStorage.getItem("tx-mastery");
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedSetIds, setSelectedSetIds] = useState([]);
  const [currentX, setCurrentX] = useState("");
  const [currentY, setCurrentY] = useState("");
  const [currentSetId, setCurrentSetId] = useState(() => {
    const saved = localStorage.getItem("tx-sets");
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && parsed.length > 0 ? parsed[0].id : "";
  });
  const [newSetName, setNewSetName] = useState("");
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [progress, setProgress] = useState({});
  const [completed, setCompleted] = useState([]);
  const [error, setError] = useState(null);
  const [editingSetId, setEditingSetId] = useState(null);
  const [editingSetName, setEditingSetName] = useState("");
  const [dragItem, setDragItem] = useState(null);
  const [dragOverSet, setDragOverSet] = useState(null);
  const [showLearned, setShowLearned] = useState(false);
  const [expandedSets, setExpandedSets] = useState({});
  const [learnedSelected, setLearnedSelected] = useState([]);
  const [moveToSetId, setMoveToSetId] = useState("");
  const [trainingPairIds, setTrainingPairIds] = useState([]);
  const [trashedSets, setTrashedSets] = useState(() => {
    const saved = localStorage.getItem("tx-trashedSets");
    return saved ? JSON.parse(saved) : [];
  });
  const [showTrashedSets, setShowTrashedSets] = useState(false);
  const [correctAnswerCache, setCorrectAnswerCache] = useState("");
  const inputRef = useRef(null);
  const xInputRef = useRef(null);
  const menuRef = useRef(null);

  const dark = theme === "dark";
  const t = {
    bg: dark ? "#1a1a2e" : "#ffffff",
    bgCard: dark ? "#252540" : "#f9fafb",
    bgCardSelected: dark ? "#2e2650" : "#ede9fe",
    bgInput: dark ? "#2a2a45" : "#ffffff",
    text: dark ? "#e2e2f0" : "#111111",
    textSec: dark ? "#9999bb" : "#666666",
    textMuted: dark ? "#666688" : "#999999",
    border: dark ? "#3a3a55" : "#e5e7eb",
    borderSelected: dark ? "#7c3aed" : "#c4b5fd",
    borderInput: dark ? "#4a4a65" : "#d1d5db",
    accent: "#8b5cf6",
    correctBg: dark ? "#1a3a2a" : "#f0fdf4",
    wrongBg: dark ? "#3a1a1a" : "#fef2f2",
    menuBg: dark ? "#2a2a45" : "#ffffff",
    dragBg: dark ? "#2e2650" : "#f5f3ff",
  };

  useEffect(() => { localStorage.setItem("tx-pairs", JSON.stringify(pairs)); }, [pairs]);
  useEffect(() => { localStorage.setItem("tx-learned", JSON.stringify(learned)); }, [learned]);
  useEffect(() => { localStorage.setItem("tx-sets", JSON.stringify(sets)); }, [sets]);
  useEffect(() => { localStorage.setItem("tx-progress", JSON.stringify(progress)); }, [progress]);
  useEffect(() => { localStorage.setItem("tx-completed", JSON.stringify(completed)); }, [completed]);
  useEffect(() => { localStorage.setItem("tx-mastery", JSON.stringify(mastery)); }, [mastery]);
  useEffect(() => { localStorage.setItem("tx-trashedSets", JSON.stringify(trashedSets)); }, [trashedSets]);
  useEffect(() => { localStorage.setItem("tx-theme", theme); }, [theme]);

  useEffect(() => {
    if (sets.length > 0 && !sets.find(s => s.id === currentSetId)) {
      setCurrentSetId(sets[0].id);
    }
  }, [sets, currentSetId]);

  useEffect(() => {
    const knownSetIds = new Set(sets.map(s => s.id));
    const defaultSetId = sets[0]?.id;
    if (!defaultSetId) return;
    setPairs(prev => {
      if (prev.every(p => knownSetIds.has(p.setId))) return prev;
      return prev.map(p => knownSetIds.has(p.setId) ? p : { ...p, setId: defaultSetId });
    });
  }, [sets]);

  useEffect(() => {
    if (mode === "training" && inputRef.current) inputRef.current.focus();
  }, [currentIdx, feedback, mode]);

  useEffect(() => {
    if (error) {
      const ti = setTimeout(() => setError(null), 2500);
      return () => clearTimeout(ti);
    }
  }, [error]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const toggleTheme = () => { setTheme(th => th === "light" ? "dark" : "light"); };

  const exportData = () => {
    const data = { pairs, learned, sets, mastery, trashedSets };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trixbi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.pairs) setPairs(data.pairs);
          if (data.learned) setLearned(data.learned);
          if (data.sets) setSets(data.sets);
          if (data.mastery) setMastery(data.mastery);
          if (data.trashedSets) setTrashedSets(data.trashedSets);
          if (data.sets && data.sets.length > 0) setCurrentSetId(data.sets[0].id);
          setError(null);
          setMenuOpen(false);
        } catch {
          setError("Invalid file format!");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const addPair = () => {
    if (!currentX.trim() || !currentY.trim()) return;
    const x = capitalize(currentX.trim());
    const y = capitalize(currentY.trim());
    const dupActive = pairs.find(p => p.x.toLowerCase() === x.toLowerCase() && p.y.toLowerCase() === y.toLowerCase());
    const dupLearned = learned.find(p => p.x.toLowerCase() === x.toLowerCase() && p.y.toLowerCase() === y.toLowerCase());
    if (dupActive || dupLearned) {
      setError("OOOPS, that is added already!");
      return;
    }
    setPairs(p => [...p, { id: generateId(), x, y, setId: currentSetId }]);
    setCurrentX("");
    setCurrentY("");
    if (xInputRef.current) xInputRef.current.focus();
  };

  const removePair = (id) => {
    const pair = pairs.find(p => p.id === id);
    if (pair) {
      setLearned(l => [...l, { ...pair, archivedFrom: pair.setId }]);
      setPairs(p => p.filter(p2 => p2.id !== id));
    }
  };

  const restoreSingle = (id) => {
    const item = learned.find(l => l.id === id);
    if (!item) return;
    const targetSet = sets.find(s => s.id === item.archivedFrom) || sets[0];
    setPairs(p => [...p, { ...item, setId: targetSet.id }]);
    setLearned(l => l.filter(l2 => l2.id !== id));
    const newMastery = { ...mastery };
    delete newMastery[item.id];
    setMastery(newMastery);
  };

  const restoreBulk = () => {
    if (learnedSelected.length === 0 || !moveToSetId) return;
    const items = learned.filter(l => learnedSelected.includes(l.id));
    setPairs(p => [...p, ...items.map(item => ({ ...item, setId: moveToSetId }))]);
    const newMastery = { ...mastery };
    items.forEach(item => { delete newMastery[item.id]; });
    setMastery(newMastery);
    setLearned(l => l.filter(l2 => !learnedSelected.includes(l2.id)));
    setLearnedSelected([]);
  };

  const toggleLearnedSelect = (id) => {
    setLearnedSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  };

  const selectAllLearned = () => {
    if (learnedSelected.length === learned.length) setLearnedSelected([]);
    else setLearnedSelected(learned.map(l => l.id));
  };

  const deletePermanently = (id) => {
    setLearned(l => l.filter(l2 => l2.id !== id));
  };

  const addSet = () => {
    if (!newSetName.trim()) return;
    const name = newSetName.trim();
    if (sets.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      setError("OOOPS, that set exists already!");
      return;
    }
    const newSet = { id: generateId(), name };
    setSets(s => [...s, newSet]);
    setNewSetName("");
    setCurrentSetId(newSet.id);
  };

  const removeSet = (id) => {
    if (sets.length <= 1) return;
    const set = sets.find(s => s.id === id);
    const sp = pairs.filter(p => p.setId === id);
    setTrashedSets(tt => [...tt, { set, pairs: sp, trashedAt: Date.now() }]);
    setPairs(p => p.filter(p2 => p2.setId !== id));
    setSets(s => s.filter(s2 => s2.id !== id));
    setSelectedSetIds(sel => sel.filter(s => s !== id));
    if (currentSetId === id) {
      const remaining = sets.filter(s => s.id !== id);
      setCurrentSetId(remaining[0]?.id || "");
    }
  };

  const restoreTrashedSet = (idx) => {
    const trashed = trashedSets[idx];
    setSets(s => [...s, trashed.set]);
    setPairs(p => [...p, ...trashed.pairs]);
    setTrashedSets(tt => tt.filter((_, i) => i !== idx));
  };

  const deleteTrashedSetPermanently = (idx) => {
    setTrashedSets(tt => tt.filter((_, i) => i !== idx));
  };

  const startRenameSet = (set) => { setEditingSetId(set.id); setEditingSetName(set.name); };
  const confirmRenameSet = () => {
    if (!editingSetName.trim()) { setEditingSetId(null); return; }
    setSets(s => s.map(set => set.id === editingSetId ? { ...set, name: editingSetName.trim() } : set));
    setEditingSetId(null); setEditingSetName("");
  };

  const toggleSetSelection = (id) => {
    setSelectedSetIds(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]);
  };

  const toggleExpandSet = (id) => {
    setExpandedSets(s => ({ ...s, [id]: !s[id] }));
  };

  const handleDragStart = (pairId) => setDragItem(pairId);
  const handleDragOver = (e, setId) => { e.preventDefault(); setDragOverSet(setId); };
  const handleDragLeave = () => setDragOverSet(null);
  const handleDrop = (e, setId) => {
    e.preventDefault(); setDragOverSet(null);
    if (dragItem) {
      setPairs(p => p.map(pair => pair.id === dragItem ? { ...pair, setId } : pair));
      setDragItem(null);
    }
  };

  const getTrainingPairs = () => {
    if (selectedSetIds.length === 0) return pairs;
    return pairs.filter(p => selectedSetIds.includes(p.setId));
  };

  const getEligiblePairs = () => {
    return getTrainingPairs().filter(p => (mastery[p.id] || 0) < TOTAL_MASTERY);
  };

  const getWordStep = (pairId) => mastery[pairId] || 0;

  const startTraining = () => {
    const eligible = getEligiblePairs();
    if (eligible.length === 0) {
      setError("All selected words have reached full mastery!");
      return;
    }
    const ids = eligible.map(p => p.id);
    setTrainingPairIds(ids);
    const init = {};
    eligible.forEach((p, i) => {
      const step = getWordStep(p.id);
      if (step === 0) {
        init[i] = { phase: 1, streak: 0 };
      } else {
        init[i] = { phase: "translate", streak: 0 };
      }
    });
    setProgress(init);
    setCompleted([]);
    const shuffled = eligible.map((_, i) => i).sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIdx(0);
    setFeedback(null);
    setAnswer("");
    setCorrectAnswerCache("");
    setMode("training");
  };

  const trainingPairs = trainingPairIds.map(id => pairs.find(p => p.id === id)).filter(Boolean);

  const buildNextQueue = (prog, compl) => {
    const remaining = trainingPairs.map((_, i) => i).filter(i => !compl.includes(i));
    if (remaining.length === 0) {
      const newMastery = { ...mastery };
      const toArchive = [];
      trainingPairs.forEach(p => {
        const current = newMastery[p.id] || 0;
        const newVal = Math.min(current + 1, TOTAL_MASTERY);
        newMastery[p.id] = newVal;
        if (newVal >= TOTAL_MASTERY) toArchive.push(p.id);
      });
      setMastery(newMastery);
      if (toArchive.length > 0) {
        setPairs(prev => {
          const archived = prev.filter(p => toArchive.includes(p.id));
          setLearned(l => [...l, ...archived.map(p => ({ ...p, archivedFrom: p.setId }))]);
          return prev.filter(p => !toArchive.includes(p.id));
        });
      }
      setMode("done");
      return;
    }
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    setQueue(shuffled); setCurrentIdx(0); setAnswer(""); setFeedback(null);
  };

  const checkAnswer = () => {
    if (feedback) return;
    const idx = queue[currentIdx];
    const pair = trainingPairs[idx];
    const p = progress[idx];
    const wordStep = getWordStep(pair.id);
    let correct = false;
    let correctAns = "";

    if (wordStep === 0) {
      if (p.phase === 1) {
        correct = answer.trim().toLowerCase() === pair.x.toLowerCase();
        correctAns = pair.x;
      } else {
        correct = answer.trim().toLowerCase() === pair.y.toLowerCase();
        correctAns = pair.y;
      }
    } else {
      correct = answer.trim().toLowerCase() === pair.y.toLowerCase();
      correctAns = pair.y;
    }

    if (correct) {
      const newStreak = p.streak + 1;
      let newProgress = { ...progress };
      let newCompleted = [...completed];
      if (wordStep === 0) {
        if (p.phase === 1 && newStreak >= PHASE_1_TARGET) {
          newProgress[idx] = { phase: 2, streak: 0 };
        } else if (p.phase === 2 && newStreak >= PHASE_2_TARGET) {
          newProgress[idx] = { phase: 3, streak: newStreak };
          newCompleted.push(idx);
        } else {
          newProgress[idx] = { ...p, streak: newStreak };
        }
      } else {
        const target = wordStep === 1 ? STEP_2_TARGET : STEP_3_TARGET;
        if (newStreak >= target) {
          newProgress[idx] = { ...p, streak: newStreak, done: true };
          newCompleted.push(idx);
        } else {
          newProgress[idx] = { ...p, streak: newStreak };
        }
      }
      setProgress(newProgress); setCompleted(newCompleted); setFeedback("correct");
      setTimeout(() => {
        if (currentIdx + 1 < queue.length) {
          const nv = queue.slice(currentIdx + 1).findIndex(q => !newCompleted.includes(q));
          if (nv !== -1) { setCurrentIdx(currentIdx + 1 + nv); setAnswer(""); setFeedback(null); }
          else buildNextQueue(newProgress, newCompleted);
        } else buildNextQueue(newProgress, newCompleted);
      }, 800);
    } else {
      let newProgress = { ...progress };
      newProgress[idx] = { ...p, streak: 0 };
      setProgress(newProgress); setFeedback("wrong");
      setCorrectAnswerCache(correctAns);
    }
  };

  const dismissWrong = () => { setFeedback(null); setAnswer(""); };
  const handleKeyDown = (e) => { if (e.key === "Enter") { feedback === "wrong" ? dismissWrong() : checkAnswer(); } };
  const handleAddKeyDown = (e) => { if (e.key === "Enter") addPair(); };
  const handleSetKeyDown = (e) => { if (e.key === "Enter") addSet(); };
  const handleRenameKeyDown = (e) => { if (e.key === "Enter") confirmRenameSet(); };

  const completedCount = completed.length;

  const getProgressPercent = () => {
    if (trainingPairs.length === 0) return 0;
    let totalNeeded = 0;
    let totalDone = 0;
    trainingPairs.forEach((p, i) => {
      const wordStep = getWordStep(p.id);
      const prog = progress[i];
      if (!prog) return;
      if (wordStep === 0) {
        const needed = PHASE_1_TARGET + PHASE_2_TARGET;
        totalNeeded += needed;
        if (prog.phase === 2) totalDone += PHASE_1_TARGET + prog.streak;
        else if (prog.phase === 3) totalDone += needed;
        else totalDone += prog.streak;
      } else {
        const target = wordStep === 1 ? STEP_2_TARGET : STEP_3_TARGET;
        totalNeeded += target;
        totalDone += prog.done ? target : prog.streak;
      }
    });
    return totalNeeded > 0 ? Math.min((totalDone / totalNeeded) * 100, 100) : 0;
  };

  // Menu component
  const MenuButton = () => (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button onClick={() => setMenuOpen(!menuOpen)}
        style={{
          background: "none", border: `1px solid ${t.borderInput}`, borderRadius: 8,
          cursor: "pointer", padding: "6px 10px", fontSize: 18, color: t.textSec,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>☰</button>
      {menuOpen && (
        <div style={{
          position: "absolute", right: 0, top: "110%", background: t.menuBg,
          border: `1px solid ${t.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          minWidth: 180, zIndex: 100, overflow: "hidden"
        }}>
          <button onClick={exportData}
            style={{
              display: "block", width: "100%", padding: "12px 16px", fontSize: 14,
              background: "none", border: "none", borderBottom: `1px solid ${t.border}`,
              cursor: "pointer", textAlign: "left", color: t.text
            }}>📤 Export data</button>
          <button onClick={importData}
            style={{
              display: "block", width: "100%", padding: "12px 16px", fontSize: 14,
              background: "none", border: "none", borderBottom: `1px solid ${t.border}`,
              cursor: "pointer", textAlign: "left", color: t.text
            }}>📥 Import data</button>
          <button onClick={() => { toggleTheme(); setMenuOpen(false); }}
            style={{
              display: "block", width: "100%", padding: "12px 16px", fontSize: 14,
              background: "none", border: "none", cursor: "pointer", textAlign: "left", color: t.text
            }}>{dark ? "☀️ Light mode" : "🌙 Dark mode"}</button>
        </div>
      )}
    </div>
  );

  // DONE
  if (mode === "done") {
    const newlyMastered = trainingPairs.filter(p => (mastery[p.id] || 0) >= TOTAL_MASTERY).length;
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, sans-serif", background: t.bg, minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: t.text, margin: "0 0 8px" }}>Training complete!</h2>
          <p style={{ color: t.textSec, margin: "0 0 12px" }}>You nailed all {trainingPairs.length} pairs.</p>
          {newlyMastered > 0 && (
            <p style={{ color: "#16a34a", fontWeight: 600, fontSize: 14, margin: "0 0 12px" }}>
              {newlyMastered} word{newlyMastered !== 1 ? "s" : ""} reached Legend status and moved to Learned!
            </p>
          )}
          <button onClick={() => { setMode("input"); setProgress({}); setCompleted([]); setSelectedSetIds([]); }}
            style={{ padding: "10px 24px", fontSize: 15, background: t.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Back to word list
          </button>
        </div>
      </div>
    );
  }

  // TRAINING
  if (mode === "training") {
    const idx = queue[currentIdx];
    const pair = trainingPairs[idx];
    const p = progress[idx];
    const wordStep = getWordStep(pair.id);
    let prompt, expectedLabel, correctAnswer;
    if (wordStep === 0) {
      const isPhase1 = p.phase === 1;
      prompt = isPhase1 ? pair.y : pair.x;
      expectedLabel = isPhase1 ? "English" : "Spanish";
      correctAnswer = isPhase1 ? pair.x : pair.y;
    } else {
      prompt = pair.x;
      expectedLabel = "Spanish";
      correctAnswer = pair.y;
    }
    const levelLabel = STEP_LABELS[wordStep];
    const levelColor = STEP_COLORS[wordStep];
    const bgGrad = dark ? STEP_BG_DARK[wordStep] : STEP_BG_LIGHT[wordStep];
    const borderColor = dark ? STEP_BORDER_DARK[wordStep] : STEP_BORDER_LIGHT[wordStep];
    let phaseDetail = "";
    let streakTarget;
    if (wordStep === 0) {
      phaseDetail = p.phase === 1 ? " — type English" : " — type Spanish";
      streakTarget = p.phase === 1 ? PHASE_1_TARGET : PHASE_2_TARGET;
    } else {
      phaseDetail = " — type Spanish";
      streakTarget = wordStep === 1 ? STEP_2_TARGET : STEP_3_TARGET;
    }

    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, sans-serif", background: t.bg, minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button onClick={() => setMode("input")}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.textSec, fontSize: 14 }}>← Back</button>
          <span style={{ fontSize: 13, color: t.textSec }}>✅ {completedCount}/{trainingPairs.length}</span>
        </div>
        <div style={{ height: 6, background: dark ? "#3a3a55" : "#e5e7eb", borderRadius: 3, marginBottom: 32, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${getProgressPercent()}%`, background: "#22c55e", borderRadius: 3, transition: "width 0.4s ease" }} />
        </div>
        <div style={{
          background: bgGrad, border: `1px solid ${borderColor}`,
          borderRadius: 14, padding: "14px 16px", marginBottom: 10, textAlign: "center"
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: levelColor, letterSpacing: 0.5 }}>
            {levelLabel}{phaseDetail}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: levelColor, marginTop: 4 }}>
            {p.streak} / {streakTarget}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: t.text, marginTop: 16 }}>{prompt}</div>
        </div>
        <input ref={inputRef} value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={`Type in ${expectedLabel}...`} disabled={feedback === "correct"}
          style={{
            width: "100%", padding: "12px 16px", fontSize: 16, borderRadius: 8, boxSizing: "border-box",
            border: feedback === "correct" ? "2px solid #22c55e" : feedback === "wrong" ? "2px solid #ef4444" : `1px solid ${t.borderInput}`,
            outline: "none", background: feedback === "correct" ? t.correctBg : feedback === "wrong" ? t.wrongBg : t.bgInput,
            color: t.text
          }} />
        {feedback === "wrong" && (
          <div style={{ marginTop: 12, padding: 12, background: t.wrongBg, borderRadius: 8, border: "1px solid #fecaca" }}>
            <div style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>Wrong — the answer is:</div>
            <div style={{ color: t.text, fontSize: 18, fontWeight: 500, marginTop: 4 }}>{correctAnswerCache}</div>
            <button onClick={dismissWrong} style={{
              marginTop: 10, padding: "6px 16px", fontSize: 13, background: "#ef4444", color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer"
            }}>Try again</button>
          </div>
        )}
        {!feedback && (
          <button onClick={checkAnswer} style={{
            marginTop: 16, width: "100%", padding: "12px 0", fontSize: 15, fontWeight: 500,
            background: t.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer"
          }}>Check</button>
        )}
        {feedback === "correct" && (
          <div style={{ marginTop: 12, textAlign: "center", color: "#16a34a", fontWeight: 600, fontSize: 15 }}>✓ Correct!</div>
        )}
      </div>
    );
  }

  // INPUT MODE
  const pairsInSet = (setId) => pairs.filter(p => p.setId === setId);
  const eligibleCount = getEligiblePairs().length;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 24, fontFamily: "system-ui, -apple-system, sans-serif", background: t.bg, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <TrixbiLogo />
        <MenuButton />
      </div>
      <p style={{ color: t.textSec, margin: "0 0 24px", fontSize: 14 }}>Add word pairs to sets, then train.</p>

      {error && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999,
          background: "#fef2f2", color: "#dc2626", padding: "10px 20px", borderRadius: 8,
          border: "1px solid #fecaca", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>{error}</div>
      )}

      {/* Add word pair */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>English</div>
            <input ref={xInputRef} value={currentX} onChange={e => setCurrentX(e.target.value)} onKeyDown={handleAddKeyDown}
              placeholder="Word / Phrase"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${t.borderInput}`, borderRadius: 8, outline: "none", boxSizing: "border-box", background: t.bgInput, color: t.text }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Spanish</div>
            <input value={currentY} onChange={e => setCurrentY(e.target.value)} onKeyDown={handleAddKeyDown}
              placeholder="Translation"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${t.borderInput}`, borderRadius: 8, outline: "none", boxSizing: "border-box", background: t.bgInput, color: t.text }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={currentSetId} onChange={e => setCurrentSetId(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${t.borderInput}`, borderRadius: 8, outline: "none", background: t.bgInput, color: t.text }}>
            {sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={addPair} style={{
            padding: "8px 18px", fontSize: 15, background: t.accent, color: "#fff",
            border: "none", borderRadius: 8, cursor: "pointer"
          }}>+ Add</button>
        </div>
      </div>

      {/* Create new set */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={newSetName} onChange={e => setNewSetName(e.target.value)} onKeyDown={handleSetKeyDown}
          placeholder="New set name..."
          style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: `1px solid ${t.borderInput}`, borderRadius: 8, outline: "none", background: t.bgInput, color: t.text }} />
        <button onClick={addSet} style={{
          padding: "8px 14px", fontSize: 13, background: dark ? "#3a3a55" : "#f3f4f6", color: t.text,
          border: `1px solid ${t.borderInput}`, borderRadius: 8, cursor: "pointer"
        }}>+ Set</button>
      </div>

      {/* Unselect */}
      {selectedSetIds.length > 0 && (
        <button onClick={() => setSelectedSetIds([])}
          style={{
            display: "block", marginBottom: 8, marginLeft: "auto", padding: "4px 12px", fontSize: 12,
            background: "transparent", color: t.accent, border: `1px solid ${t.borderSelected}`,
            borderRadius: 6, cursor: "pointer"
          }}>
          Unselect
        </button>
      )}

      {/* Sets */}
      {sets.map(set => {
        const sp = pairsInSet(set.id);
        const isSelected = selectedSetIds.includes(set.id);
        const isDragOver = dragOverSet === set.id;
        const isExpanded = !!expandedSets[set.id];
        return (
          <div key={set.id}
            onDragOver={(e) => handleDragOver(e, set.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, set.id)}
            style={{
              border: isDragOver ? `2px dashed ${t.accent}` : isSelected ? `1.5px solid ${t.borderSelected}` : `1px solid ${t.border}`,
              borderRadius: 10, marginBottom: 12, overflow: "hidden",
              background: isDragOver ? t.dragBg : isSelected ? (dark ? "#2e2650" : "#f5f3ff") : (dark ? t.bgCard : "#fff"),
              transition: "all 0.15s ease"
            }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", background: isSelected ? t.bgCardSelected : t.bgCard, cursor: "pointer"
            }} onClick={() => toggleExpandSet(set.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block", fontSize: 10, color: t.textMuted }}>▶</span>
                <div onClick={e => { e.stopPropagation(); toggleSetSelection(set.id); }}
                  style={{
                    width: 18, height: 18, borderRadius: 4, cursor: "pointer", flexShrink: 0,
                    border: isSelected ? `2px solid ${t.accent}` : `2px solid ${t.borderInput}`,
                    background: isSelected ? t.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease"
                  }}>
                  {isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                {editingSetId === set.id ? (
                  <input value={editingSetName} onChange={e => setEditingSetName(e.target.value)}
                    onKeyDown={handleRenameKeyDown} onBlur={confirmRenameSet} autoFocus
                    onClick={e => e.stopPropagation()}
                    style={{ padding: "2px 6px", fontSize: 14, border: `1px solid ${t.borderInput}`, borderRadius: 4, outline: "none", width: 120, background: t.bgInput, color: t.text }} />
                ) : (
                  <span style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{set.name}</span>
                )}
                <span style={{ fontSize: 12, color: t.textMuted }}>({sp.length})</span>
              </div>
              <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                <button onClick={(e) => { e.stopPropagation(); startRenameSet(set); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8b9ab5", fontSize: 12, padding: "2px 4px" }}
                  title="Rename set">✏️</button>
                {sets.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removeSet(set.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 14, padding: "2px 4px" }}
                    title="Delete set (moves to Trash)">🗑</button>
                )}
              </div>
            </div>
            {isExpanded && sp.map(p => (
              <div key={p.id} draggable onDragStart={() => handleDragStart(p.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 14px", borderBottom: `1px solid ${dark ? "#3a3a55" : "#f3f4f6"}`, fontSize: 14, cursor: "grab", userSelect: "none"
                }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ color: t.textMuted, marginRight: 4, fontSize: 12 }}>⠿</span>
                  <span style={{ fontWeight: 500, color: t.text }}>{p.x}</span>
                  <span style={{ color: t.textMuted }}>→</span>
                  <span style={{ color: t.textSec }}>{p.y}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MasteryDots mastery={mastery[p.id] || 0} />
                  <button onClick={() => removePair(p.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 16, padding: "0 4px" }}
                    title="Move to Learned">×</button>
                </div>
              </div>
            ))}
            {isExpanded && sp.length === 0 && (
              <div style={{ padding: "12px 14px", color: t.textMuted, fontSize: 13, textAlign: "center" }}>
                Drag words here or add new ones above
              </div>
            )}
          </div>
        );
      })}

      {/* Begin Training */}
      <button onClick={startTraining} disabled={eligibleCount === 0}
        style={{
          width: "100%", padding: "12px 0", fontSize: 15, fontWeight: 600, marginTop: 8,
          background: eligibleCount === 0 ? (dark ? "#3a3a55" : "#d1d5db") : t.accent, color: "#fff",
          border: "none", borderRadius: 8, cursor: eligibleCount === 0 ? "default" : "pointer"
        }}>
        Begin Training ({selectedSetIds.length === 0 ? `All ${eligibleCount}` : eligibleCount} pair{eligibleCount !== 1 ? "s" : ""})
      </button>
      {selectedSetIds.length === 0 && pairs.length > 0 && (
        <div style={{ textAlign: "center", fontSize: 12, color: t.textMuted, marginTop: 6 }}>
          No sets selected — all words will be trained
        </div>
      )}

      {/* Learned Section */}
      <div style={{ marginTop: 32, borderTop: `1px solid ${t.border}`, paddingTop: 20 }}>
        <button onClick={() => setShowLearned(!showLearned)}
          style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600,
            color: t.textSec, display: "flex", alignItems: "center", gap: 6, padding: 0
          }}>
          <span style={{ transform: showLearned ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▶</span>
          Learned ({learned.length})
        </button>

        {showLearned && learned.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={selectAllLearned} style={{
                padding: "4px 10px", fontSize: 12, background: dark ? "#3a3a55" : "#f3f4f6", color: t.text,
                border: `1px solid ${t.borderInput}`, borderRadius: 6, cursor: "pointer"
              }}>
                {learnedSelected.length === learned.length ? "Deselect all" : "Select all"}
              </button>
              {learnedSelected.length > 0 && (
                <>
                  <select value={moveToSetId} onChange={e => setMoveToSetId(e.target.value)}
                    style={{ padding: "4px 8px", fontSize: 12, border: `1px solid ${t.borderInput}`, borderRadius: 6, background: t.bgInput, color: t.text }}>
                    <option value="">Move to set...</option>
                    {sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={restoreBulk} disabled={!moveToSetId}
                    style={{
                      padding: "4px 10px", fontSize: 12, background: moveToSetId ? t.accent : (dark ? "#3a3a55" : "#d1d5db"),
                      color: "#fff", border: "none", borderRadius: 6, cursor: moveToSetId ? "pointer" : "default"
                    }}>
                    Move ({learnedSelected.length})
                  </button>
                </>
              )}
            </div>

            <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
              {learned.map(p => {
                const fromSet = sets.find(s => s.id === p.archivedFrom);
                const isChecked = learnedSelected.includes(p.id);
                return (
                  <div key={p.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 14px", borderBottom: `1px solid ${dark ? "#3a3a55" : "#f3f4f6"}`, fontSize: 14,
                    background: isChecked ? (dark ? "#2e2650" : "#eff6ff") : "transparent"
                  }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleLearnedSelect(p.id)} style={{ cursor: "pointer" }} />
                      <span style={{ fontWeight: 500, color: t.text }}>{p.x}</span>
                      <span style={{ color: t.textMuted }}>→</span>
                      <span style={{ color: t.textSec }}>{p.y}</span>
                      {fromSet && <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 4 }}>from {fromSet.name}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => restoreSingle(p.id)}
                        style={{ padding: "3px 8px", fontSize: 11, background: dark ? "#1a3a2a" : "#f0fdf4", color: "#16a34a",
                          border: "1px solid #bbf7d0", borderRadius: 4, cursor: "pointer" }}
                        title="Add back to training">↩ Back</button>
                      <button onClick={() => deletePermanently(p.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 14 }}
                        title="Delete permanently">×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showLearned && learned.length === 0 && (
          <div style={{ marginTop: 10, color: t.textMuted, fontSize: 13 }}>
            No learned words yet. Words you remove from sets will appear here.
          </div>
        )}
      </div>

      {/* Trashed Sets */}
      {trashedSets.length > 0 && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
          <button onClick={() => setShowTrashedSets(!showTrashedSets)}
            style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600,
              color: t.textMuted, display: "flex", alignItems: "center", gap: 6, padding: 0
            }}>
            <span style={{ transform: showTrashedSets ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▶</span>
            Trash ({trashedSets.length} set{trashedSets.length !== 1 ? "s" : ""})
          </button>

          {showTrashedSets && (
            <div style={{ marginTop: 10 }}>
              {trashedSets.map((tt, idx) => (
                <div key={idx} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", border: `1px solid ${dark ? "#3a3a55" : "#f3f4f6"}`, borderRadius: 8, marginBottom: 8,
                  background: t.bgCard
                }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: t.textSec }}>{tt.set.name}</span>
                    <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 6 }}>({tt.pairs.length} word{tt.pairs.length !== 1 ? "s" : ""})</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => restoreTrashedSet(idx)}
                      style={{ padding: "4px 10px", fontSize: 12, background: dark ? "#1a3a2a" : "#f0fdf4", color: "#16a34a",
                        border: "1px solid #bbf7d0", borderRadius: 5, cursor: "pointer" }}>
                      ↩ Restore
                    </button>
                    <button onClick={() => deleteTrashedSetPermanently(idx)}
                      style={{ padding: "4px 10px", fontSize: 12, background: dark ? "#3a1a1a" : "#fef2f2", color: "#dc2626",
                        border: "1px solid #fecaca", borderRadius: 5, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}