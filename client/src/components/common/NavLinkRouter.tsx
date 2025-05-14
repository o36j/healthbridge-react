import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, LinkProps } from 'react-router-dom';

type NavLinkRouterProps = {
  to: LinkProps['to'];
  children: React.ReactNode;
  className?: string;
};

/**
 * A component that combines React-Bootstrap Nav.Link with React Router Link
 * to avoid TypeScript errors when using Nav.Link with as={Link}
 */
const NavLinkRouter: React.FC<NavLinkRouterProps> = ({ to, children, className }) => {
  // Use a custom component instead of directly using as={Link}
  const CustomLink = React.forwardRef<HTMLAnchorElement, LinkProps>((linkProps, ref) => (
    <Link ref={ref} to={to} {...linkProps} />
  ));
  
  // Set display name for dev tools
  CustomLink.displayName = 'CustomLink';

  return (
    <Nav.Link as={CustomLink} className={className}>
      {children}
    </Nav.Link>
  );
};

export default NavLinkRouter; 