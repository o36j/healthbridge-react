import React from 'react';
import { Button as BootstrapButton, Spinner } from 'react-bootstrap';

type ButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
};

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  isLoading = false,
  disabled = false,
  ...props
}: ButtonProps) => {
  // Map custom variants to Bootstrap variants
  const getVariant = (): string => {
    switch (variant) {
      case 'outline':
        return 'outline-primary';
      case 'secondary':
        return 'secondary';
      case 'danger':
        return 'danger';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  // Map size to Bootstrap sizes
  const getSize = (): 'sm' | 'lg' | undefined => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return 'lg';
      default:
        return undefined;
    }
  };

  return (
    <BootstrapButton
      type={type}
      variant={getVariant()}
      size={getSize()}
      className={className}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="d-flex align-items-center">
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </BootstrapButton>
  );
};

export default Button; 