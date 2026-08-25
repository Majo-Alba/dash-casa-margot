import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Gauge, Megaphone, Package, Radio, Workflow, GitCompareArrows, CalendarRange, ShieldCheck, StickyNote, LineChart, ChevronDown, Users, Network } from 'lucide-react';

const items = [
  { icon: Home, label: 'Tablero general', path: '/dashboard', active: true },
  { icon: Gauge, label: 'Cuatro palancas', path: '/palancas' },
  { icon: Megaphone, label: 'Esfuerzos', path: '/esfuerzos' },
  { icon: Package, label: 'Productos y promociones', path: '/productos-promociones', active: true },
  { icon: Users, label: 'Clientes', path: '/clientes', active: true },
  { icon: Network, label: 'Canales', path: '/canales' },
  { icon: Radio, label: 'Medios de llegada', path: '/medios' },
  { icon: Workflow, label: 'Proceso comercial', path: '/proceso' },
  { icon: GitCompareArrows, label: 'Comparador', path: '/comparador' },
  { icon: CalendarRange, label: 'Eventos', path: '/eventos' },
  { icon: LineChart, label: 'Ventas', path: '/ventas', active: true },
  { icon: ShieldCheck, label: 'Calidad de información', path: '/calidad' },
  { icon: StickyNote, label: 'Notas y preguntas', path: '/notas' }
];

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar dashSidebar">
      <div className="logo">DAS<span>H</span><small>by Meridiano Conecta</small></div>
      <nav>
        {items.map(({ icon: Icon, label, path, active }) => (
          <button key={path} type="button" onClick={() => navigate(path)} className={location.pathname === path ? 'active' : ''}>
            <Icon size={18}/>
            <span className="sidebarLabel">{label}</span>
            {!active && <small className="soonBadge">Próximamente</small>}
          </button>
        ))}
      </nav>
      <div className="sideFooter"><button type="button">Casa Margot <ChevronDown size={16}/></button></div>
    </aside>
  );
}
