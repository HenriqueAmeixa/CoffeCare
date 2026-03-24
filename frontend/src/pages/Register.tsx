import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Mail, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/register', {
        email,
        password
      });
      
      // Auto-login after successful registration could be implemented,
      // but let's just redirect to login for simplicity.
      navigate('/login');
    } catch (err: any) {
      if (err.response && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Erro ao realizar o cadastro. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-green-50">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full shadow-inner">
              <Leaf className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-2 tracking-tight">Criar Conta</h2>
          <p className="text-center text-gray-500 mb-8 font-medium">Junte-se ao CoffeCare e cuide da sua plantação</p>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-600 p-4 rounded-md text-sm mb-6 animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm font-medium transition-all outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm font-medium transition-all outline-none"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-green-200 text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all hover:scale-[1.02] active:scale-95 mt-8"
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500 font-medium">Já possui uma conta? </span>
            <Link to="/login" className="font-bold text-green-600 hover:text-green-700 transition-colors">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
