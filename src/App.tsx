import React, { useState, useEffect } from 'react';
// Import removed
import { Lessons } from './pages/Lessons';
import { LessonReader } from './pages/LessonReader';
import { Settings } from './pages/Settings';
import { Import } from './pages/Import';
import { Quiz } from './pages/Quiz';
import { AdminUsers } from './pages/AdminUsers';
import { SyncState } from './types/sync';
import { storage } from './engine/storage';
import { useAuth } from './state/AuthContext';
import { LoginPage } from './pages/Login';
import { LogOut, Book, Settings as SettingsIcon, Menu, X, Upload, ArrowLeftRight, Trophy, Users } from 'lucide-react';
import { SidebarSearch } from './components/SidebarSearch';
import { useDisplaySettings } from './state/DisplaySettingsContext';

export default function App() {
  const { user, isAdmin, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<'lessons' | 'reader' | 'settings' | 'import' | 'quiz' | 'users'>('lessons');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, updateSettings } = useDisplaySettings();
  const isRev = settings.isReversed;

  if (!user) return <LoginPage />;

  // Navigation handlers
  const navigateTo = (page: 'lessons' | 'reader' | 'settings' | 'import' | 'quiz' | 'users', lessonId?: string) => {
    setCurrentPage(page);
    if (lessonId) setSelectedLessonId(lessonId);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen overflow-hidden">
        <style>{`
          .custom-sidebar::-webkit-scrollbar { width: 4px; }
          .custom-sidebar::-webkit-scrollbar-track { background: transparent; }
          .custom-sidebar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          .custom-sidebar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        `}</style>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary-100">
            B
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 uppercase">{isRev ? 'Български' : 'Bulgarca'}</span>
        </div>

        {/* BG/TR Toggle */}
        <div className="px-4 mb-3 shrink-0">
          <button
            onClick={() => updateSettings({ isReversed: !isRev })}
            className={`w-full flex items-center justify-center gap-2.5 px-3 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
              isRev 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
            }`}
          >
            <span className="text-lg">🌐</span>
            <span>{isRev ? 'TR ➝ BG' : 'BG ➝ TR'}</span>
            <ArrowLeftRight size={16} className="opacity-70" />
          </button>
        </div>

        <nav className="px-4 space-y-1 shrink-0">
          <SidebarLink 
            icon={<Book size={20} />} 
            label={isRev ? 'Учебна програма' : 'Ders Programı'} 
            active={currentPage === 'lessons' || currentPage === 'reader'} 
            onClick={() => navigateTo('lessons')} 
          />
          {isAdmin && (
            <SidebarLink 
              icon={<Upload size={20} />} 
              label={isRev ? 'Импортиране' : 'İçe Aktar'} 
              active={currentPage === 'import'} 
              onClick={() => navigateTo('import')} 
            />
          )}
          {isAdmin && (
            <SidebarLink 
              icon={<Users size={20} />} 
              label={isRev ? 'Потребители' : 'Kullanıcılar'} 
              active={currentPage === 'users'} 
              onClick={() => navigateTo('users')} 
            />
          )}
          <SidebarLink 
            icon={<SettingsIcon size={20} />} 
            label={isRev ? 'Настройки' : 'Ayarlar'} 
            active={currentPage === 'settings'} 
            onClick={() => navigateTo('settings')} 
          />
          <SidebarLink 
            icon={<Trophy size={20} />} 
            label={isRev ? 'Тест' : 'Quiz'} 
            active={currentPage === 'quiz'} 
            onClick={() => navigateTo('quiz')} 
          />
        </nav>

        <div className="h-px bg-slate-100 mx-6 my-2 shrink-0" />
        <SidebarSearch />

        <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 group relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${isAdmin ? 'bg-slate-900' : 'bg-emerald-500'}`}>
              {user.username.slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-slate-800 truncate">{user.username}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{isAdmin ? (isRev ? 'Админ' : 'Yönetici') : (isRev ? 'Ниво A1' : 'A1 Seviyesi')}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut size={14} />
            {isRev ? 'Изход' : 'Çıkış Yap'}
          </button>
        </div>
      </aside>

      {/* Mobile Nav Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
          <span className="font-bold text-slate-800 uppercase">{isRev ? 'Български' : 'Bulgarca'}</span>
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
            <span className="font-bold text-xl text-slate-800 uppercase">{isRev ? 'Български' : 'Bulgarca'}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          <SidebarLink icon={<Book size={20} />} label={isRev ? 'Учебна програма' : 'Ders Programı'} active={currentPage === 'lessons' || currentPage === 'reader'} onClick={() => navigateTo('lessons')} />
          {isAdmin && <SidebarLink icon={<Upload size={20} />} label={isRev ? 'Импортиране' : 'İçe Aktar'} active={currentPage === 'import'} onClick={() => navigateTo('import')} />}
          {isAdmin && <SidebarLink icon={<Users size={20} />} label={isRev ? 'Потребители' : 'Kullanıcılar'} active={currentPage === 'users'} onClick={() => navigateTo('users')} />}
          <SidebarLink icon={<SettingsIcon size={20} />} label={isRev ? 'Настройки' : 'Ayarlar'} active={currentPage === 'settings'} onClick={() => navigateTo('settings')} />
          <SidebarLink icon={<Trophy size={20} />} label={isRev ? 'Тест' : 'Quiz'} active={currentPage === 'quiz'} onClick={() => navigateTo('quiz')} />
        </nav>
        <div className="px-4 py-2">
          <button
            onClick={() => updateSettings({ isReversed: !isRev })}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
              isRev ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <ArrowLeftRight size={14} />
            {isRev ? 'TR ➝ BG' : 'BG ➝ TR'}
          </button>
        </div>
        <div className="h-px bg-slate-100 mx-6 my-2 shrink-0" />
        <div className="shrink-0">
          <SidebarSearch />
        </div>
        <div className="flex-1" />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen pt-16 lg:pt-0 flex flex-col">
        <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-5xl mx-auto w-full">
          {currentPage === 'lessons' && <Lessons onSelectLesson={(id) => navigateTo('reader', id)} />}
          {currentPage === 'reader' && selectedLessonId && (
            <LessonReader 
              lessonId={selectedLessonId} 
              onBack={() => navigateTo('lessons')} 
            />
          )}
          {currentPage === 'import' && <Import />}
          {currentPage === 'settings' && <Settings />}
          {currentPage === 'quiz' && <Quiz />}
          {currentPage === 'users' && <AdminUsers />}
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
