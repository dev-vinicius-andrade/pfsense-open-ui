import { Box, Card, CardActionArea, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colorSchemes } from '@/theme/schemes';

interface ThemePreviewCardProps {
  name: string;
  schemeName: string;
  isSelected: boolean;
  onSelect: () => void;
}

function extractColor(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'main' in value && typeof (value as Record<string, unknown>).main === 'string') {
    return (value as Record<string, unknown>).main as string;
  }
  return fallback;
}

function getSwatchColors(schemeName: string): { primary: string; secondary: string; background: string; text: string } {
  const scheme = colorSchemes[schemeName] ?? colorSchemes['default-teal'];
  const palette = scheme.light ?? scheme.dark;
  return {
    primary: extractColor(palette?.primary, '#00897B'),
    secondary: extractColor(palette?.secondary, '#FFA000'),
    background: extractColor(palette?.background?.paper, '#FFFFFF'),
    text: extractColor(palette?.text?.primary, '#37474F'),
  };
}

export function ThemePreviewCard({ name, schemeName, isSelected, onSelect }: ThemePreviewCardProps) {
  const colors = getSwatchColors(schemeName);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: isSelected ? 'primary.main' : 'divider',
        borderWidth: isSelected ? 2 : 1,
        position: 'relative',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: 'primary.light',
        },
      }}
    >
      <CardActionArea onClick={onSelect} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          {isSelected && <CheckCircleIcon color="primary" fontSize="small" aria-label="Selected" />}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }} role="img" aria-label={`Color preview for ${name}`}>
          {[colors.primary, colors.secondary, colors.background, colors.text].map((color, index) => (
            <Box
              key={index}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: color,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          ))}
        </Box>
      </CardActionArea>
    </Card>
  );
}