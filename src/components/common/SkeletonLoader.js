import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <>
        {items.map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-text" />
            <div className="skeleton-line skeleton-text short" />
          </div>
        ))}
      </>
        );
  }

  if (type === 'list') {
    return (
      <>
        {items.map((i) => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-text" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return null;
};

export default SkeletonLoader;
