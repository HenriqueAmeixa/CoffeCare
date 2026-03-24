import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, History, Leaf, LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-green-100">
        <div className="flex items-center gap-2 text-green-700">
          <Leaf className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">CoffeCare</h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-lg w-full mx-auto space-y-6">
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-6 text-white shadow-lg shadow-green-200/50 relative overflow-hidden">
          <Leaf className="absolute -bottom-6 -right-6 w-32 h-32 text-green-500 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">Análise Inteligente</h2>
          <p className="text-green-50 mb-6 text-sm">Descubra se suas plantas de café estão saudáveis ou precisam de cuidados.</p>
          <button
            onClick={() => navigate('/capture')}
            className="w-full bg-white text-green-700 font-bold py-3.5 px-4 rounded-xl shadow-sm hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Nova Consulta
          </button>
        </div>

        <section>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-lg font-bold text-gray-800">Consultas Recentes</h3>
            <button onClick={() => navigate('/history')} className="text-sm font-medium text-green-600 hover:text-green-700">Ver todas</button>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center py-10">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-sm">Nenhuma consulta realizada ainda.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
