import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardScreen from './components/dashboardScreen';
import ProductosPromocionesScreen from './components/productosPromocionesScreen';
import ClientesScreen from './components/clientesScreen';
import VentasScreen from './components/ventasScreen';
import ComingSoon from './components/ComingSoon';
import Notfound from './components/NotFound';
import MobileNav from './components/MobileNav';

function Soon({ title }) {
  return <ComingSoon title={title}/>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Notfound/>}/>

        {/* ACTIVE PILOT SCREENS */}
        <Route path="/" element={<DashboardScreen/>}/>
        <Route path="/dashboard" element={<DashboardScreen/>}/>
        <Route path="/summary" element={<DashboardScreen/>}/>
        <Route path="/productos-promociones" element={<ProductosPromocionesScreen/>}/>
        <Route path="/clientes" element={<ClientesScreen/>}/>
        <Route path="/ventas" element={<VentasScreen/>}/>

        {/* COMING SOON */}
        <Route path="/palancas" element={<Soon title="Cuatro palancas"/>}/>
        <Route path="/esfuerzos" element={<Soon title="Esfuerzos"/>}/>
        <Route path="/canales" element={<Soon title="Canales"/>}/>
        <Route path="/medios" element={<Soon title="Medios de llegada"/>}/>
        <Route path="/proceso" element={<Soon title="Proceso comercial"/>}/>
        <Route path="/comparador" element={<Soon title="Comparador"/>}/>
        <Route path="/eventos" element={<Soon title="Eventos"/>}/>
        <Route path="/calidad" element={<Soon title="Calidad de información"/>}/>
        <Route path="/notas" element={<Soon title="Notas y preguntas"/>}/>
      </Routes>
      <MobileNav/>
    </BrowserRouter>
  );
}




// ----> LAST FUNCTIONAL AUG27/26 <-----



// import './App.css';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import DashboardScreen from './components/dashboardScreen';
// import ProductosPromocionesScreen from './components/productosPromocionesScreen';
// import ClientesScreen from './components/clientesScreen';
// import VentasScreen from './components/ventasScreen';
// import ComingSoon from './components/ComingSoon';
// import Notfound from './components/NotFound';

// function Soon({ title }) {
//   return <ComingSoon title={title}/>;
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="*" element={<Notfound/>}/>

//         {/* ACTIVE PILOT SCREENS */}
//         <Route path="/" element={<DashboardScreen/>}/>
//         <Route path="/dashboard" element={<DashboardScreen/>}/>
//         <Route path="/summary" element={<DashboardScreen/>}/>
//         <Route path="/productos-promociones" element={<ProductosPromocionesScreen/>}/>
//         <Route path="/clientes" element={<ClientesScreen/>}/>
//         <Route path="/ventas" element={<VentasScreen/>}/>

//         {/* COMING SOON */}
//         <Route path="/palancas" element={<Soon title="Cuatro palancas"/>}/>
//         <Route path="/esfuerzos" element={<Soon title="Esfuerzos"/>}/>
//         <Route path="/canales" element={<Soon title="Canales"/>}/>
//         <Route path="/medios" element={<Soon title="Medios de llegada"/>}/>
//         <Route path="/proceso" element={<Soon title="Proceso comercial"/>}/>
//         <Route path="/comparador" element={<Soon title="Comparador"/>}/>
//         <Route path="/eventos" element={<Soon title="Eventos"/>}/>
//         <Route path="/calidad" element={<Soon title="Calidad de información"/>}/>
//         <Route path="/notas" element={<Soon title="Notas y preguntas"/>}/>
//       </Routes>
//     </BrowserRouter>
//   );
// }
