function StatsGrid({ statCards }) {
  return (
    <section className="stats-grid">
      {statCards.map((card) => (
        <article key={card.label} className={`stat-card ${card.tone}`}>
          <p className="muted">{card.label}</p>
          <h3>{card.value}</h3>
        </article>
      ))}
    </section>
  )
}

export default StatsGrid
