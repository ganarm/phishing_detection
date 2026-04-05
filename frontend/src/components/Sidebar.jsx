import { LayoutDashboard, Menu, MoonStar, ShieldCheck, SunMedium, Blocks,History, Layers, ChevronLeft, ChevronRight } from 'lucide-react'

function Sidebar({
  apiStatus,
  navItems,
  activeSection,
  setActiveSection,
  modulesCount,
  theme,
  setTheme,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {
  return (
    <aside className={sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'} aria-label="Main navigation">
      <div className="rail-top">
        <button className="brand-button" onClick={() => setActiveSection('predict')} aria-label="Home">
          <div className="brand-logo">
            <ShieldCheck size={18} />
          </div>
          {!sidebarCollapsed ? (
            <div className="brand-info">
              <strong>PhishingShield</strong>
              {/* <small className="muted sub-info">Security Platform</small> */}
            </div>
          ) : null}
        </button>

        <div className="rail-top-controls">
          <button
            className="hide-toggle"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Hide sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Hide sidebar'}
          >
            {!sidebarCollapsed ? (
              <>
                <ChevronLeft size={14} />
                {/* <span>Hide sidebar</span> */}
              </>
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        </div>
      </div>

      <nav className="rail-nav" role="navigation">
        {navItems.map((item, idx) => (
          <button
            type="button"
            key={item.id}
            className={activeSection === item.id ? 'rail-item active' : 'rail-item'}
            onClick={() => setActiveSection(item.id)}
            title={item.label}
            aria-current={activeSection === item.id ? 'page' : undefined}
          >
            <span className="rail-icon">
              {idx === 0 && <LayoutDashboard size={18} />}
              {idx === 1 && <Layers size={18} />}
              {idx === 2 && <Menu size={18} />}
              {idx === 3 && <Blocks size={18} />}
              {idx === 4 && <History size={18} />}

            </span>
            {!sidebarCollapsed ? <span className="rail-label">{item.label}</span> : null}
          </button>
        ))}
      </nav>

      <div className="rail-bottom">
        <div className="rail-status">
          <span className={apiStatus === 'ok' ? 'status-dot good' : 'status-dot'} aria-hidden></span>
          {!sidebarCollapsed ? (
            <div>
              <div className="muted">API</div>
              <div className="status-small">{apiStatus}</div>
            </div>
          ) : null}
        </div>

        {/* <div className="rail-actions">
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
          </button>

          <button
            className="icon-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={16} />
          </button>
        </div> */}
      </div>
    </aside>
  )
}

export default Sidebar
