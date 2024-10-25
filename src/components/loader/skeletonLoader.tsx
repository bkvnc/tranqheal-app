import React from 'react';

const SkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 1 }) => {
    return (
        <div className="animate-pulse">
            {[...Array(rows)].map((_, index) => (
                <div key={index} className="h-4 bg-gray-300 rounded mb-2"></div>
            ))}
        </div>
    );
};

export default SkeletonLoader;