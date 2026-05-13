import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Lessons } from './pages/Lessons';
import { LessonReader } from './pages/LessonReader';
import { Settings } from './pages/Settings';
import { Import } from './pages/Import';
import { SyncState } from './types/sync';
import { storage } from './engine/storage';
import { Book, Settings as SettingsIcon, LayoutDashboard, Menu, X, Upload } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'lessons' | 'reader' | 'settings' | 'import'>('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Navigation handlers
  const navigateTo = (page: 'dashboard' | 'lessons' | 'reader' | 'settings' | 'import', lessonId?: string) => {
    setCurrentPage(page);
    if (lessonId) setSelectedLessonId(lessonId);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-100">
            B
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 uppercase">Bulgarca</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarLink 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={currentPage === 'dashboard'} 
            onClick={() => navigateTo('dashboard')} 
          />
          <SidebarLink 
            icon={<Book size={20} />} 
            label="Dersler" 
            active={currentPage === 'lessons' || currentPage === 'reader'} 
            onClick={() => navigateTo('lessons')} 
          />
          <SidebarLink 
            icon={<Upload size={20} />} 
            label="İçe Aktar" 
            active={currentPage === 'import'} 
            onClick={() => navigateTo('import')} 
          />
          <SidebarLink 
            icon={<SettingsIcon size={20} />} 
            label="Ayarlar" 
            active={currentPage === 'settings'} 
            onClick={() => navigateTo('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full"></div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-slate-800 truncate">Mustafa</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">A1 Seviyesi</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
          <span className="font-bold text-slate-800 uppercase">Bulgarca</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-[70] transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold">B</div>
            <span className="font-bold text-xl text-slate-800 uppercase">Bulgarca</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => navigateTo('dashboard')} />
          <SidebarLink icon={<Book size={20} />} label="Dersler" active={currentPage === 'lessons' || currentPage === 'reader'} onClick={() => navigateTo('lessons')} />
          <SidebarLink icon={<Upload size={20} />} label="İçe Aktar" active={currentPage === 'import'} onClick={() => navigateTo('import')} />
          <SidebarLink icon={<SettingsIcon size={20} />} label="Ayarlar" active={currentPage === 'settings'} onClick={() => navigateTo('settings')} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen pt-16 lg:pt-0 flex flex-col">
        <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-5xl mx-auto w-full">
          {currentPage === 'dashboard' && <Dashboard onStartLesson={(id) => navigateTo('reader', id)} />}
          {currentPage === 'lessons' && <Lessons onSelectLesson={(id) => navigateTo('reader', id)} />}
          {currentPage === 'reader' && selectedLessonId && (
            <LessonReader 
              lessonId={selectedLessonId} 
              onBack={() => navigateTo('lessons')} 
            />
          )}
          {currentPage === 'import' && <Import />}
          {currentPage === 'settings' && <Settings />}
        </div>
        
        <footer className="mt-auto py-8 border-t border-slate-100 text-center text-slate-400 text-xs">
          &copy; 2026 Bulgarca Eğitim Uygulaması (MVP)
        </footer>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        active 
          ? 'bg-primary-50 text-primary-600 shadow-sm shadow-primary-100' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-primary-600' : 'text-slate-400'}>{icon}</span>
      {label}
    </button>
  );
}
