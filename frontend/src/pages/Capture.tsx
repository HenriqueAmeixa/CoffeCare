import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, Image as ImageIcon, Loader2, MapPin } from 'lucide-react';
import axios from 'axios';

export default function Capture() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      // Capturar localização
      if ('geolocation' in navigator) {
         navigator.geolocation.getCurrentPosition(
           (position) => {
             setLocation({
               lat: position.coords.latitude,
               lng: position.coords.longitude
             });
           },
           (error) => console.log('Erro ao obter localização', error)
         );
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    
    setIsUploading(true);
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      // Backend não exige lat/lng no momento, mas poderia ser salvo no DB
      if (location) {
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
      }
      
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      navigate('/results', { state: { image: response.data.url } });
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Nova Captura</h1>
      </header>
      
      <main className="flex-1 p-6 max-w-lg w-full mx-auto flex flex-col">
        {!previewUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white w-full rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center shadow-inner">
                <Camera className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Tire uma foto da planta</h3>
                <p className="text-gray-500 text-sm px-4 font-medium">Concentre-se na folha afetada para garantir uma melhor análise da IA.</p>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-md shadow-green-200 hover:bg-green-700 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Fotografar ou Selecionar
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
                <MapPin className="w-4 h-4" />
                 Sua localização poderá ser anexada ao laudo
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
             <div className="flex-1 mt-4 relative rounded-3xl overflow-hidden bg-black shadow-inner border border-gray-200">
               <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
               {location && (
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-md">
                    <MapPin className="w-3 h-3 text-green-400" /> GPS Localizado
                  </div>
               )}
             </div>
             
             <div className="pt-6 flex gap-4">
               <button 
                 onClick={() => {
                   setPreviewUrl(null);
                   setSelectedImage(null);
                   setLocation(null);
                 }}
                 disabled={isUploading}
                 className="flex-1 bg-white text-gray-700 border border-gray-200 font-bold py-3.5 rounded-2xl hover:bg-gray-50 active:scale-95 transition disabled:opacity-50"
               >
                 Repetir
               </button>
               <button 
                 onClick={handleUpload}
                 disabled={isUploading}
                 className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-2xl shadow-md hover:bg-green-700 active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                 {isUploading ? 'Enviando...' : 'Analisar Foto'}
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
