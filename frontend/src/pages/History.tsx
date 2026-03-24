import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function History() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:8000/history/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setConsultations(response.data);
      } catch (error) {
        console.error("Erro ao buscar histórico", error);
      }
    };
    fetchHistory();
  }, []);

  const filtered = consultations.filter(c => 
    c.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-4 flex items-center gap-4 border-b border-green-100">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Histórico de Consultas</h1>
      </header>

      <main className="flex-1 p-6 max-w-lg w-full mx-auto space-y-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white shadow-sm"
            placeholder="Buscar por doença..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white rounded-3xl border border-gray-100 shadow-sm font-medium">
              Nenhuma consulta encontrada.
            </div>
          ) : (
            filtered.map((item) => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-gray-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group" 
                onClick={() => navigate('/results', { state: { image: item.image_url, historyData: item }})}
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={`http://localhost:8000${item.image_url}`} alt="Planta" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">{item.disease}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="ml-2 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-100">
                       {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
