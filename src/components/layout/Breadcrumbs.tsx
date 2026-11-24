import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useMatches } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface RouteMatch {
  handle?: {
    breadcrumb?: string;
  };
  pathname: string;
}

export function Breadcrumbs() {
  const matches = useMatches() as RouteMatch[];

  const crumbs = matches.filter((match) => match.handle?.breadcrumb);

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {crumbs.map((match, index) => {
        const label = match.handle?.breadcrumb ?? '';
        const isLast = index === crumbs.length - 1;

        if (isLast) {
          return (
            <Typography key={match.pathname} color="text.primary">
              {label}
            </Typography>
          );
        }

        return (
          <Link
            key={match.pathname}
            component={RouterLink}
            to={match.pathname}
            underline="hover"
            color="inherit"
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}