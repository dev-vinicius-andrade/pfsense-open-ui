import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useMatches } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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
      separator={<ChevronRightIcon sx={{ fontSize: 14, opacity: 0.5 }} />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {crumbs.map((match, index) => {
        const label = match.handle?.breadcrumb ?? '';
        const isLast = index === crumbs.length - 1;

        if (isLast) {
          return (
            <Typography
              key={match.pathname}
              variant="body2"
              color="text.secondary"
            >
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
            color="text.secondary"
            sx={{ opacity: 0.7, fontSize: '0.8rem' }}
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}