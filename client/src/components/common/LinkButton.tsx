import React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import { Link, LinkProps } from 'react-router-dom';

type LinkButtonProps = ButtonProps & {
  to: LinkProps['to'];
  children: React.ReactNode;
};

/**
 * A component that combines React-Bootstrap Button with React Router Link
 * to avoid TypeScript errors when using Button with as={Link}
 */
const LinkButton: React.FC<LinkButtonProps> = ({ to, children, ...buttonProps }) => {
  // Use a custom component instead of directly using as={Link}
  const CustomLink = React.forwardRef<HTMLAnchorElement, LinkProps>((linkProps, ref) => (
    <Link ref={ref} to={to} {...linkProps} />
  ));
  
  // Set display name for dev tools
  CustomLink.displayName = 'CustomLink';

  return (
    <Button
      as={CustomLink}
      {...buttonProps}
    >
      {children}
    </Button>
  );
};

export default LinkButton; 