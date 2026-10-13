// Routing helpers for a program's pages. A program's pages are addressed relative to the
// program ("/ch03/inventory"); these wrappers add the program's id, so components never
// build a full URL and a program can be mounted under any id.
import { forwardRef } from 'react';
import { Link as RouterLink, NavLink as RouterNavLink, useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import { program } from './course';

/** "/rhel9-ansible/ch03/x#h" → "/rhel9-ansible/ch03/x/#h": every page's address ends with a slash, the form the
 * static host serves its HTML file under, so links never go through a redirect. */
export function withSlash(path) {
  const cut = path.search(/[?#]/);
  const [route, rest] = cut === -1 ? [path, ''] : [path.slice(0, cut), path.slice(cut)];
  return `${route.endsWith('/') ? route : `${route}/`}${rest}`;
}

/** "/ch03/x" → "/rhel9-ansible/ch03/x/"; anything not rooted (hashes, objects) is left alone. */
export function programPath(to) {
  return typeof to === 'string' && to.startsWith('/') ? withSlash(`/${program.id}${to === '/' ? '' : to}`) : to;
}

/** The current location with the program prefix removed ("/rhel9-ansible/ch03/x" → "/ch03/x"). */
export function useProgramLocation() {
  const location = useLocation();
  const prefix = `/${program.id}`;
  let pathname = location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) || '/' : location.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return { ...location, pathname };
}

export const Link = forwardRef(function Link({ to, ...props }, ref) {
  return <RouterLink ref={ref} to={programPath(to)} {...props} />;
});

export const NavLink = forwardRef(function NavLink({ to, ...props }, ref) {
  return <RouterNavLink ref={ref} to={programPath(to)} {...props} />;
});

/** A link to the site itself rather than to a page of the open program. */
export { RouterLink as RootLink };

export function useNavigate() {
  const navigate = useRouterNavigate();
  return (to, options) => navigate(typeof to === 'number' ? to : programPath(to), options);
}
