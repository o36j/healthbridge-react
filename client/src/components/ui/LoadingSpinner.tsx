import React from 'react';
import { Spinner } from 'react-bootstrap';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  fullScreen = false,
  text
}) => {
  // Map sizes to Bootstrap Spinner sizes
  const spinnerSize = size === 'sm' ? 'sm' : undefined;
  
  // Calculate spinner visual size
  const visualSize = size === 'lg' ? 'spinner-lg' : '';

  // Container class based on fullScreen prop
  const containerClass = fullScreen
    ? 'd-flex justify-content-center align-items-center min-vh-100'
    : 'd-flex justify-content-center align-items-center';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="text-center">
        <Spinner
          animation="border"
          variant={variant}
          size={spinnerSize}
          className={visualSize}
          role="status"
        />
        {text && <div className="mt-2">{text}</div>}
      </div>
    </div>
  );
};

export default LoadingSpinner; 