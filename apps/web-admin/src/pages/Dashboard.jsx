const Dashboard = () => {
  return (
    <div className="content-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Dashboard Overview</h2>
          <div className="header-actions">
            <button className="quick-action-btn">
              + Quick Action
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Posts</h3>
            <p>12</p>
            <div className="stat-trend positive">+2 this week</div>
          </div>
          <div className="stat-card">
            <h3>Published</h3>
            <p>8</p>
            <div className="stat-trend positive">+1 this week</div>
          </div>
          <div className="stat-card">
            <h3>Drafts</h3>
            <p>3</p>
            <div className="stat-trend neutral">No change</div>
          </div>
          <div className="stat-card">
            <h3>Media Files</h3>
            <p>24</p>
            <div className="stat-trend positive">+5 this week</div>
          </div>
        </div>

        <div className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <p><strong>New post created</strong> - "Getting Started with WriteFlow"</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🖼️</div>
              <div className="activity-content">
                <p><strong>Image uploaded</strong> - featured-image.jpg</p>
                <span className="activity-time">5 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📊</div>
              <div className="activity-content">
                <p><strong>Post published</strong> - "Content Strategy Tips"</p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
