// app-core/src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, Zap, Aperture, BookOpen, Users, Settings } from 'lucide-react';
import { testAIConnection } from './services/firebaseService';
import { Nunito, Dancing_Script } from 'next/font/google'; // Asumiendo uso de Next.js o importar estilos globales

// --- DISEÑO ---
// Aquí se usan clases de Tailwind CSS para aplicar el Design System

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    // Prueba la conexión con el backend AI al cargar la app
    testAIConnection();
  }, []);
  
  return (
    <div className={`min-h-screen bg-rose-50 font-nunito`}> {/* Paleta y Tipografía */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-3xl font-dancing-script text-purple-600">
          Carmelita 4.0
        </h1>
        <nav className="space-x-4">
          <Link to="/dashboard" className="text-purple-500 hover:text-purple-700">Dashboard</Link>
          <Link to="/login" className="text-emerald-500 hover:text-emerald-700">Login</Link>
          <Link to="/admin" className="text-amber-500 hover:text-amber-700">Admin</Link>
        </nav>
      </header>

      <div className="flex">
        {/* Menú de Navegación (El conector de Microfrontends) */}
        <nav className="w-64 bg-white p-4 shadow-lg h-[calc(100vh-64px)]">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Herramientas</h3>
          <ul className="space-y-2">
            <NavItem icon={Zap} to="/finanzas/register" label="Registro Financiero" />
            <NavItem icon={Aperture} to="/marketing/agency" label="La Agencia AI" />
            <NavItem icon={BookOpen} to="/comunidad/university" label="Universidad" />
            <NavItem icon={Users} to="/gestion/clients" label="Mis Clientes (CRM)" />
            {/* Estos links cargarán las otras mini-aplicaciones */}
          </ul>
        </nav>

        {/* Contenido Principal con Diseño (rounded-3xl) */}
        <main className="flex-1 p-8">
          <div className="bg-white p-6 rounded-3xl shadow-xl min-h-[80vh]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ElementType; to: string; label: string }> = ({ icon: Icon, to, label }) => (
  <li>
    <Link 
      to={to} 
      className="flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:bg-rose-100 hover:text-purple-600 transition"
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  </li>
);

// --- COMPONENTES DE PÁGINA (PLACEHOLDERS) ---
const LoginPage = () => <div className="text-center py-10"><h2 className="text-3xl text-purple-600">Iniciar Sesión / Onboarding</h2></div>;
const Dashboard = () => <div className="text-center py-10"><h2 className="text-3xl text-emerald-600">Dashboard Central (Árbol Financiero)</h2><p className="mt-4">Accede a las herramientas desde el menú lateral.</p></div>;
const AdminPage = () => <div className="text-center py-10"><h2 className="text-3xl text-amber-600">Panel de Superadmin</h2></div>;
const NotFound = () => <div className="text-center py-20"><h2 className="text-4xl text-red-500">404 - Página no encontrada</h2></div>;
// Placeholder para futuras mini-aplicaciones
const MiniAppPlaceholder = ({ name }: { name: string }) => <div className="text-center py-10"><h2 className="text-3xl text-gray-700">Mini-Aplicación: {name}</h2><p>Este es un módulo independiente.</p></div>;


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas/Auth */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas con Layout (Requieren Autenticación) */}
        <Route path="*" element={<Layout><Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPage />} />
          
          {/* PLACEHOLDERS PARA FUTURAS MINI-APPS (Microfrontends) */}
          <Route path="/finanzas/*" element={<MiniAppPlaceholder name="Finanzas" />} />
          <Route path="/marketing/*" element={<MiniAppPlaceholder name="Marketing" />} />
          <Route path="/comunidad/*" element={<MiniAppPlaceholder name="Comunidad" />} />
          <Route path="/gestion/*" element={<MiniAppPlaceholder name="Gestión" />} />

          {/* Fallback para rutas no definidas */}
          <Route path="*" element={<NotFound />} />

        </Routes></Layout>} />
      </Routes>
    </Router>
  );
};

export default App;
