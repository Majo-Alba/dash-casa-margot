import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Package,
  Users,
  LineChart,
  MoreHorizontal,
  Gauge,
  Megaphone,
  Network,
  Radio,
  Workflow,
  GitCompareArrows,
  CalendarRange,
  ShieldCheck,
  StickyNote,
  X,
  Sparkles
} from 'lucide-react';

const primaryItems = [
  { icon: Home, label: 'Tablero', path: '/dashboard' },
  { icon: Package, label: 'Productos', path: '/productos-promociones' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: LineChart, label: 'Ventas', path: '/ventas' }
];

const moreItems = [
  { icon: Gauge, label: 'Cuatro palancas', path: '/palancas' },
  { icon: Megaphone, label: 'Esfuerzos', path: '/esfuerzos' },
  { icon: Network, label: 'Canales', path: '/canales' },
  { icon: Radio, label: 'Medios de llegada', path: '/medios' },
  { icon: Workflow, label: 'Proceso comercial', path: '/proceso' },
  { icon: GitCompareArrows, label: 'Comparador', path: '/comparador' },
  { icon: CalendarRange, label: 'Eventos', path: '/eventos' },
  { icon: ShieldCheck, label: 'Calidad de información', path: '/calidad' },
  { icon: StickyNote, label: 'Notas y preguntas', path: '/notas' }
];

function normalizePath(pathname) {
  if (pathname === '/' || pathname === '/summary') return '/dashboard';
  return pathname;
}

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const currentPath = normalizePath(location.pathname);
  const isMoreRoute = moreItems.some((item) => item.path === currentPath);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="mobileNav" aria-label="Navegación principal móvil">
        <div className="mobileNavInner">
          {primaryItems.map(({ icon: Icon, label, path }) => {
            const active = currentPath === path;
            return (
              <button
                key={path}
                type="button"
                className={active ? 'active' : ''}
                onClick={() => goTo(path)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="mobileNavIcon"><Icon size={20}/></span>
                <small>{label}</small>
              </button>
            );
          })}

          <button
            type="button"
            className={open || isMoreRoute ? 'active' : ''}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <span className="mobileNavIcon"><MoreHorizontal size={21}/></span>
            <small>Más</small>
          </button>
        </div>
      </nav>

      {open && (
        <div className="mobileMoreOverlay" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="mobileMoreSheet"
            role="dialog"
            aria-modal="true"
            aria-label="Más módulos de DASH"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mobileSheetHandle"/>

            <header className="mobileMoreHeader">
              <div>
                <span className="mobileMoreEyebrow"><Sparkles size={14}/> Próximamente en DASH</span>
                <h2>Más inteligencia para tu negocio</h2>
                <p>Explora los módulos que iremos activando conforme aumente la información disponible.</p>
              </div>
              <button type="button" className="mobileMoreClose" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X size={20}/>
              </button>
            </header>

            <div className="mobileMoreGrid">
              {moreItems.map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  type="button"
                  className={currentPath === path ? 'active' : ''}
                  onClick={() => goTo(path)}
                >
                  <span><Icon size={19}/></span>
                  <div>
                    <b>{label}</b>
                    <small>Próximamente</small>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
