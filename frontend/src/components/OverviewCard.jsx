function OverviewCard() {
  return (
    <section className="overview-card">
      <h3>Platform Overview</h3>
      <p>
        This workspace helps analysts detect malicious URLs, run high-volume scans, compare model behavior,
        and monitor live training logs in one place.
      </p>
      <div className="overview-points">
        <span>1) Scan suspicious URLs</span>
        <span>2) Validate model performance</span>
        <span>3) Retrain and monitor models</span>
      </div>
    </section>
  )
}

export default OverviewCard
