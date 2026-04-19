import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Journal from './pages/Journal';
import './index.css';

function App() {
  const [journalEntries, setJournalEntries] = useState(() => {
    const saved = localStorage.getItem('moodTune_journalEntries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('moodTune_journalEntries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  const handleSaveEntry = (entry) => {
    setJournalEntries(prev => [...prev, entry]);
    alert("Saved to Journal! Check the Mindfulness Journal tab.");
  };

  const handleDeleteEntry = (id) => {
    setJournalEntries(prev => prev.filter(entry => entry.id !== id));
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-container">
        <Routes>
          <Route path="/" element={<Home onSaveEntry={handleSaveEntry} />} />
          <Route path="/journal" element={<Journal entries={journalEntries} onDeleteEntry={handleDeleteEntry} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
