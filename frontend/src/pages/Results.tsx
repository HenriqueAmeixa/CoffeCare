import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, Info, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [resultData, setResultData] = useState<any>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const imageUrl = location.state?.image;
  const filename = imageUrl ? imageUrl.split('/').pop() : null;

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!filename) {
      navigate('/capture');
      return;
    }

    // Evitar reconexão se análise já concluiu
    if (isDone) return;

    let active = true; // Flag para cancelar se o efeito for limpo (React StrictMode)

    const ws = new WebSocket('ws://localhost:8000/ws/analyze');
    wsRef.current = ws;
    
    ws.onopen = () => {
      if (!active) {
        ws.close(); // Efeito foi limpo antes de conectar (StrictMode), fecha e ignora
        return;
      }
      ws.send(JSON.stringify({ filename, user_id: 1 }));
    };

    ws.onmessage = (event) => {
      if (!active) return;
      const data = JSON.parse(event.data);
      if (data.status === 'processing' || data.status === 'generating') {
         setMessages(prev => [...prev, data.message]);
      }
      
      if (data.status === 'done') {
        setIsDone(true);
        setResultData({
          disease: data.disease,
          confidence: data.confidence,
          treatment: data.treatment
        });
      } else if (data.status === 'error') {
        setIsDone(true);
        setMessages(prev => [...prev, "Erro na análise: " + data.message]);
      }
    };

    ws.onerror = () => {
      if (!active) return;
      console.error('WebSocket erro de conexão');
    };

    ws.onclose = (event) => {
      if (!active) return;
      // Código 1000/1005 = fechamento normal pelo servidor após enviar 'done'. Ignorar.
      if (!isDone && event.code !== 1000 && event.code !== 1005) {
        setMessages(prev => [...prev, "Não foi possível gerar a sugestão de tratamento. O Ollama está rodando localmente?"]);
        setIsDone(true);
      }
    };

    return () => {
      active = false; // Sinaliza que este efeito foi cancelado
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [filename, navigate]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`laudo-coffecare-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF', error);
      alert('Não foi possível gerar o PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Resultado da Análise</h1>
      </header>

      <main className="flex-1 p-6 max-w-lg w-full mx-auto space-y-6">
        <div ref={reportRef} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           {imageUrl && (
             <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-black shadow-inner">
               <img src={`http://localhost:8000${imageUrl}`} alt="Foto da folha analisada" className="w-full h-full object-contain" />
             </div>
           )}

           {!isDone ? (
             <div className="space-y-4">
               <div className="flex justify-center mb-6">
                 <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
               </div>
               {messages.map((msg, i) => (
                 <div key={i} className={`p-4 rounded-xl text-center text-sm font-semibold transition-all ${i === messages.length - 1 ? 'bg-green-50 z-10 text-green-700 animate-pulse transform scale-105 border border-green-200' : 'text-gray-400 opacity-50'}`}>
                   {msg}
                 </div>
               ))}
             </div>
           ) : (
             <div className="space-y-6 animate-fade-in">
               <div className="flex items-start gap-4 p-5 bg-green-50 border border-green-200 rounded-2xl">
                 <CheckCircle className="w-10 h-10 text-green-600 flex-shrink-0" />
                 <div>
                   <h3 className="text-xl font-bold text-gray-800">Diagnóstico</h3>
                   <p className="text-2xl font-extrabold text-green-700 mt-1">{resultData.disease}</p>
                   {resultData.confidence && (
                     <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       {(resultData.confidence * 100).toFixed(1)}% de Certeza
                     </div>
                   )}
                 </div>
               </div>
               
               <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                 <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                   <Info className="w-6 h-6 text-blue-500" /> Plano de Ação - IA (Ollama)
                 </h4>
                 <div className="text-gray-700 text-sm leading-relaxed space-y-3 whitespace-pre-wrap font-medium">
                   {resultData.treatment}
                 </div>
               </div>

               <div className="flex gap-3">
                 <button 
                   onClick={exportPDF}
                   disabled={isExporting}
                   className="flex-1 bg-white border border-green-600 text-green-700 font-bold py-3.5 px-4 rounded-2xl shadow-sm hover:bg-green-50 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   <Download className="w-5 h-5" />
                   {isExporting ? 'Exportando...' : 'Exportar PDF'}
                 </button>
                 <button 
                   onClick={() => navigate('/dashboard')}
                   className="flex-1 bg-green-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition flex items-center justify-center"
                 >
                   Sair
                 </button>
               </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
