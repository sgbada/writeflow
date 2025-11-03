const PostList = () => {
  return (
    <div className="content-container">
      <div className="posts-content">
        <div className="posts-header">
          <h2>Post Management</h2>
          <button className="create-post-btn">
            + Create New Post
          </button>
        </div>

        <div className="posts-table-container">
          <table className="posts-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Author</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="post-title">
                    <strong>Getting Started with WriteFlow</strong>
                    <div className="post-excerpt">A beginner's guide to using our CMS platform...</div>
                  </div>
                </td>
                <td>
                  <span className="status-badge published">Published</span>
                </td>
                <td>Admin</td>
                <td>2 hours ago</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit">Edit</button>
                    <button className="btn-delete">Delete</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="5" className="no-posts">
                  No additional posts created yet. Click "Create New Post" to get started!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PostList;
