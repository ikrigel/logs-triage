import './LoadingSkeleton.css';

export type SkeletonType = 'card' | 'text' | 'line' | 'circle' | 'metric';

interface LoadingSkeletonProps {
  type?: SkeletonType;
  count?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function LoadingSkeleton({
  type = 'card',
  count = 1,
  width,
  height,
  className = '',
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count });

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const getSkeletonContent = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton-header" />
            <div className="skeleton-body">
              <div className="skeleton-line" />
              <div className="skeleton-line" style={{ width: '80%' }} />
            </div>
          </div>
        );
      case 'text':
        return <div className="skeleton-text" style={style} />;
      case 'line':
        return <div className="skeleton-line" style={style} />;
      case 'circle':
        return <div className="skeleton-circle" style={style} />;
      case 'metric':
        return (
          <div className="skeleton-metric">
            <div className="skeleton-icon" />
            <div className="skeleton-body">
              <div className="skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton-line" style={{ width: '80%' }} />
            </div>
          </div>
        );
      default:
        return <div className="skeleton-card" />;
    }
  };

  if (count === 1) {
    return <div className={`loading-skeleton ${className}`}>{getSkeletonContent()}</div>;
  }

  return (
    <div className={`loading-skeleton-grid ${className}`}>
      {skeletons.map((_, i) => (
        <div key={i} className="loading-skeleton">
          {getSkeletonContent()}
        </div>
      ))}
    </div>
  );
}

// Specialized skeleton components
export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return <LoadingSkeleton type="card" count={count} />;
}

export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return <LoadingSkeleton type="metric" count={count} />;
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="loading-skeleton-group">
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton key={i} type="line" />
      ))}
    </div>
  );
}
