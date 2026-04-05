import { MoonStar, PanelLeftClose, PanelLeftOpen, SunMedium } from 'lucide-react'

function TopBar({ theme, setTheme, sidebarCollapsed, setSidebarCollapsed, activeSection }) {
  return (
    <header className="topbar">
      <div>
        {activeSection === 'learn' ? (
          <>
            <h2>Learn: Models, SHAP & Phishing Signals</h2>
            <p className="muted">Detailed guidance about each detection model, explainability (SHAP), and the common phishing parameters we use.</p>
          </>
        ) : null}
      </div>
      <div className="chips-row topbar-actions">
        <button type="button" className="chip-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <SunMedium size={15} /> : <MoonStar size={15} />}
          {/* <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span> */}
        </button>
        <span className="chip">Environment: Local</span>
        {/* <span className="chip">API: /api</span> */}
      </div>
    </header>
  )
}

export default TopBar
