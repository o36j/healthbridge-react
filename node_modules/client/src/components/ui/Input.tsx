import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Form } from 'react-bootstrap';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  containerClassName?: string;
  size?: 'sm' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, containerClassName = '', className = '', size, ...rest }, ref) => {
    return (
      <Form.Group className={containerClassName}>
        {label && (
          <Form.Label>{label}</Form.Label>
        )}
        <Form.Control
          ref={ref}
          className={className}
          isInvalid={!!error}
          size={size}
          {...rest as any}
        />
        {error && (
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        )}
      </Form.Group>
    );
  }
);

Input.displayName = 'Input';

export default Input; 