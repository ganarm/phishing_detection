import { MoonStar, PanelLeftClose, PanelLeftOpen, SunMedium } from 'lucide-react'

function TopBar({ theme, setTheme, sidebarCollapsed, setSidebarCollapsed }) {
  return (
    <header className="topbar">
      <div>
        <p className="page-kicker">Operations Console</p>
        <h2>Threat Intelligence Workspace</h2>
      </div>
      <div className="chips-row topbar-actions">
        <button type="button" className="chip-button" onClick={() => setSidebarCollapsed((value) => !value)}>
          {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          <span>{sidebarCollapsed ? 'Open sidebar' : 'Hide sidebar'}</span>
        </button>
        <button type="button" className="chip-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <SunMedium size={15} /> : <MoonStar size={15} />}
          <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
        </button>
        <span className="chip">Environment: Local</span>
        <span className="chip">API: /api</span>
      </div>
    </header>
  )
}

export default TopBar
