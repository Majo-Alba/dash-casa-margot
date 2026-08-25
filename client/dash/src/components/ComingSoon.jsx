import { Construction, Sparkles, ArrowRight } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function ComingSoon({ title = 'Próximamente' }) {
  return (
    <main className="appShell">
      <AppSidebar />
      <div className="dashboard comingSoonPage">
        <section className="comingSoonCard">
          <div className="comingSoonIcon"><Construction size={34}/></div>
          <p className="eyebrow">DASH · Próxima evolución</p>
          <h1>{title}</h1>
          <h2>En construcción. ¡Espéralo pronto!</h2>
          <p className="comingSoonCopy">
            Estamos preparando nuevos cruces de información para ayudarte a descubrir qué esfuerzos, medios y decisiones comerciales están generando mejores resultados.
          </p>
          <div className="comingSoonHint"><Sparkles size={18}/><span>Más inteligencia, nuevas comparaciones y mejores preguntas para decidir.</span></div>
          <button type="button" className="comingSoonGhost" onClick={() => window.history.back()}>
            Regresar <ArrowRight size={17}/>
          </button>
        </section>
      </div>
    </main>
  );
}
