import { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CodeIcon from '@mui/icons-material/Code';
import WidgetsIcon from '@mui/icons-material/Widgets';
import type { CustomWidget, ConfigWidget, TemplateWidget } from '@/config/schema';
import { useConfigStore } from '@/stores/configStore';
import {
  DATA_SOURCE_REGISTRY,
  getDataSourcesByCategory,
  getDataSourceById,
} from '@/pages/dashboard/dataSourceRegistry';
import { getDisplayComponent } from '@/pages/dashboard/displayTypes/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WidgetType = 'config' | 'template';

interface ThresholdEntry {
  value: number;
  color: string;
  label: string;
}

interface FieldMappingEntry {
  apiField: string;
  displayField: string;
}

interface ConfigFormValues {
  title: string;
  description: string;
  dataSource: string;
  displayType: ConfigWidget['displayType'];
  refreshInterval: number;
  accentColor: string;
  fieldMappings: FieldMappingEntry[];
  thresholds: ThresholdEntry[];
}

interface TemplateFormValues {
  title: string;
  description: string;
  template: string;
  css: string;
  apiEndpoints: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVALS = [5, 10, 15, 30, 60, 120, 300] as const;

const DISPLAY_TYPES: { value: ConfigWidget['displayType']; label: string }[] = [
  { value: 'gauge', label: 'Gauge' },
  { value: 'stat-card', label: 'Stat Card' },
  { value: 'line-chart', label: 'Line Chart' },
  { value: 'bar-chart', label: 'Bar Chart' },
  { value: 'table', label: 'Table' },
  { value: 'list', label: 'List' },
  { value: 'status-indicator', label: 'Status Indicator' },
];

const ACCENT_COLORS = [
  '#26a69a', // teal
  '#42a5f5', // blue
  '#ef5350', // red
  '#66bb6a', // green
  '#ffa726', // orange
  '#ab47bc', // purple
  '#78909c', // grey-blue
  '#ec407a', // pink
];

const TEMPLATE_MAX_SIZE = 10240;
const CSS_MAX_SIZE = 5120;
const MAX_API_ENDPOINTS = 5;

// Mock data for preview
const MOCK_PREVIEW_DATA: Record<string, unknown> = {
  value: 72,
  cpu_usage: 45,
  memory_usage: 68,
  disk_usage: 52,
  uptime: 864000,
  load_average: [1.2, 0.8, 0.5],
  count: 1250,
  max: 10000,
  usage_percent: 12.5,
  items: [
    { name: 'WAN', status: 'online', ip: '203.0.113.1' },
    { name: 'LAN', status: 'online', ip: '192.168.1.1' },
    { name: 'OPT1', status: 'offline', ip: '10.0.0.1' },
  ],
};

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const configFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  dataSource: z.string().min(1, 'Data source is required'),
  displayType: z.enum([
    'gauge', 'stat-card', 'line-chart', 'bar-chart', 'table', 'list', 'status-indicator',
  ]),
  refreshInterval: z.number().min(5).max(300),
  accentColor: z.string(),
  fieldMappings: z.array(z.object({
    apiField: z.string(),
    displayField: z.string(),
  })),
  thresholds: z.array(z.object({
    value: z.number(),
    color: z.string(),
    label: z.string(),
  })),
});

const templateFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  template: z.string().min(1, 'Template is required').max(TEMPLATE_MAX_SIZE),
  css: z.string().max(CSS_MAX_SIZE),
  apiEndpoints: z.array(z.string()).max(MAX_API_ENDPOINTS),
});

// ---------------------------------------------------------------------------
// Helper: generate unique ID
// ---------------------------------------------------------------------------

function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Sub-component: Widget List View
// ---------------------------------------------------------------------------

interface WidgetListViewProps {
  widgets: CustomWidget[];
  onAdd: () => void;
  onEdit: (widget: CustomWidget) => void;
  onDelete: (id: string) => void;
}

function WidgetListView({ widgets, onAdd, onEdit, onDelete }: WidgetListViewProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDeleteClick = useCallback((id: string) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId);
    }
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  }, [pendingDeleteId, onDelete]);

  if (widgets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <WidgetsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No custom widgets yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create your first custom widget to personalize your dashboard.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Create Your First Widget
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          {widgets.length} custom widget{widgets.length !== 1 ? 's' : ''}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Add Widget
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Source / Template</TableCell>
              <TableCell align="right">Refresh</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {widgets.map((widget) => (
              <TableRow key={widget.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {widget.title}
                  </Typography>
                  {widget.description && (
                    <Typography variant="caption" color="text.secondary">
                      {widget.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={widget.type === 'config' ? <DashboardIcon /> : <CodeIcon />}
                    label={widget.type === 'config' ? 'Config' : 'Template'}
                    size="small"
                    color={widget.type === 'config' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                    {widget.type === 'config'
                      ? getDataSourceById(widget.dataSource)?.label ?? widget.dataSource
                      : `${widget.template.slice(0, 40)}...`}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{widget.refreshInterval}s</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onEdit(widget)} aria-label={`Edit ${widget.title}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(widget.id)}
                    aria-label={`Delete ${widget.title}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Widget?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. The widget will be removed from your dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Config Widget Form
// ---------------------------------------------------------------------------

interface ConfigWidgetFormProps {
  initialValues?: ConfigWidget;
  onSave: (values: ConfigFormValues) => void;
  onCancel: () => void;
}

function ConfigWidgetForm({ initialValues, onSave, onCancel }: ConfigWidgetFormProps) {
  const defaultValues: ConfigFormValues = {
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    dataSource: initialValues?.dataSource ?? '',
    displayType: initialValues?.displayType ?? 'stat-card',
    refreshInterval: initialValues?.refreshInterval ?? 30,
    accentColor: initialValues?.accentColor ?? ACCENT_COLORS[0],
    fieldMappings: initialValues?.fieldMapping
      ? Object.entries(initialValues.fieldMapping).map(([displayField, apiField]) => ({
          apiField,
          displayField,
        }))
      : [],
    thresholds: initialValues?.thresholds?.map((t) => ({
      value: t.value,
      color: t.color,
      label: t.label ?? '',
    })) ?? [],
  };

  const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedDisplayType = watch('displayType');
  const watchedDataSource = watch('dataSource');
  const watchedAccentColor = watch('accentColor');
  const watchedThresholds = watch('thresholds');
  const watchedFieldMappings = watch('fieldMappings');

  const selectedDataSource = useMemo(
    () => getDataSourceById(watchedDataSource),
    [watchedDataSource],
  );

  const showThresholds = watchedDisplayType === 'gauge' || watchedDisplayType === 'stat-card';

  const onSubmit = useCallback(
    (data: ConfigFormValues) => {
      onSave(data);
    },
    [onSave],
  );

  // Preview component
  const DisplayComponent = useMemo(
    () => getDisplayComponent(watchedDisplayType),
    [watchedDisplayType],
  );

  const previewData = useMemo(() => {
    const mapping: Record<string, string> = {};
    for (const fm of watchedFieldMappings) {
      if (fm.apiField && fm.displayField) {
        mapping[fm.displayField] = fm.apiField;
      }
    }
    return { ...MOCK_PREVIEW_DATA, fieldMapping: mapping };
  }, [watchedFieldMappings]);

  const dataSourcesByCategory = useMemo(() => getDataSourcesByCategory(), []);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        {/* Left column: form fields */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Widget Title"
                  fullWidth
                  required
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  placeholder="Optional description"
                />
              )}
            />

            <Controller
              name="dataSource"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.dataSource}>
                  <InputLabel>Data Source</InputLabel>
                  <Select {...field} label="Data Source">
                    {Array.from(dataSourcesByCategory.entries()).map(([category, sources]) => (
                      <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                        {sources.map((ds) => (
                          <MenuItem key={ds.id} value={ds.id}>
                            {ds.label}
                          </MenuItem>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  {errors.dataSource && (
                    <FormHelperText>{errors.dataSource.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {selectedDataSource && (
              <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
                <Typography variant="caption">{selectedDataSource.description}</Typography>
              </Alert>
            )}

            <Controller
              name="displayType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Display Type</InputLabel>
                  <Select {...field} label="Display Type">
                    {DISPLAY_TYPES.map((dt) => (
                      <MenuItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Refresh Interval: {watch('refreshInterval')}s
              </Typography>
              <Controller
                name="refreshInterval"
                control={control}
                render={({ field }) => (
                  <Slider
                    {...field}
                    min={5}
                    max={300}
                    step={5}
                    marks={REFRESH_INTERVALS.map((v) => ({ value: v, label: `${v}s` }))}
                    valueLabelDisplay="auto"
                    aria-label="Refresh interval"
                  />
                )}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Accent Color</Typography>
              <Controller
                name="accentColor"
                control={control}
                render={({ field }) => (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map((color) => (
                      <Box
                        key={color}
                        component="button"
                        type="button"
                        onClick={() => field.onChange(color)}
                        aria-label={`Select color ${color}`}
                        aria-pressed={field.value === color}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          border: field.value === color ? '3px solid' : '2px solid transparent',
                          borderColor: field.value === color ? 'text.primary' : 'transparent',
                          backgroundColor: color,
                          cursor: 'pointer',
                          transition: 'border-color 0.15s',
                          '&:hover': { transform: 'scale(1.1)' },
                          '&:focus-visible': { outline: '2px solid', outlineOffset: 2 },
                        }}
                      />
                    ))}
                  </Stack>
                )}
              />
            </Box>

            {/* Field Mapping */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Field Mapping</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Map API response fields to display fields. Leave empty to use defaults.
              </Typography>
              <Controller
                name="fieldMappings"
                control={control}
                render={({ field }) => (
                  <Stack spacing={1}>
                    {field.value.map((entry, index) => (
                      <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <TextField
                          size="small"
                          label="API Field"
                          value={entry.apiField}
                          onChange={(e) => {
                            const next = [...field.value];
                            next[index] = { ...next[index], apiField: e.target.value };
                            field.onChange(next);
                          }}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Display Field"
                          value={entry.displayField}
                          onChange={(e) => {
                            const next = [...field.value];
                            next[index] = { ...next[index], displayField: e.target.value };
                            field.onChange(next);
                          }}
                          sx={{ flex: 1 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            const next = field.value.filter((_, i) => i !== index);
                            field.onChange(next);
                          }}
                          aria-label="Remove field mapping"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        field.onChange([...field.value, { apiField: '', displayField: '' }])
                      }
                    >
                      Add Mapping
                    </Button>
                  </Stack>
                )}
              />
            </Box>

            {/* Thresholds - only for gauge and stat-card */}
            {showThresholds && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Thresholds</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Define value thresholds that change the widget color.
                </Typography>
                <Controller
                  name="thresholds"
                  control={control}
                  render={({ field }) => (
                    <Stack spacing={1}>
                      {field.value.map((entry, index) => (
                        <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <TextField
                            size="small"
                            label="Value"
                            type="number"
                            value={entry.value}
                            onChange={(e) => {
                              const next = [...field.value];
                              next[index] = { ...next[index], value: Number(e.target.value) };
                              field.onChange(next);
                            }}
                            sx={{ width: 100 }}
                          />
                          <TextField
                            size="small"
                            label="Color"
                            type="color"
                            value={entry.color}
                            onChange={(e) => {
                              const next = [...field.value];
                              next[index] = { ...next[index], color: e.target.value };
                              field.onChange(next);
                            }}
                            sx={{ width: 80 }}
                            slotProps={{ htmlInput: { style: { padding: 4, height: 32 } } }}
                          />
                          <TextField
                            size="small"
                            label="Label"
                            value={entry.label}
                            onChange={(e) => {
                              const next = [...field.value];
                              next[index] = { ...next[index], label: e.target.value };
                              field.onChange(next);
                            }}
                            sx={{ flex: 1 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              const next = field.value.filter((_, i) => i !== index);
                              field.onChange(next);
                            }}
                            aria-label="Remove threshold"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          field.onChange([...field.value, { value: 0, color: '#ef5350', label: '' }])
                        }
                      >
                        Add Threshold
                      </Button>
                    </Stack>
                  )}
                />
              </Box>
            )}
          </Stack>
        </Grid>

        {/* Right column: live preview */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, alignSelf: 'flex-start' }}>
              Live Preview
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 320 }}>
              <DisplayComponent
                data={previewData}
                fieldMapping={Object.fromEntries(
                  watchedFieldMappings
                    .filter((fm) => fm.apiField && fm.displayField)
                    .map((fm) => [fm.displayField, fm.apiField]),
                )}
                thresholds={watchedThresholds
                  .filter((t) => t.color)
                  .map((t) => ({ value: t.value, color: t.color, label: t.label || undefined }))}
                colorAccent={watchedAccentColor}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={!isValid}>
          Save Widget
        </Button>
      </Stack>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Template Widget Form
// ---------------------------------------------------------------------------

interface TemplateWidgetFormProps {
  initialValues?: TemplateWidget;
  onSave: (values: TemplateFormValues) => void;
  onCancel: () => void;
}

function TemplateWidgetForm({ initialValues, onSave, onCancel }: TemplateWidgetFormProps) {
  const defaultValues: TemplateFormValues = {
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    template: initialValues?.template ?? '',
    css: initialValues?.css ?? '',
    apiEndpoints: initialValues?.apiEndpoints ?? [],
  };

  const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedTemplate = watch('template');
  const watchedCss = watch('css');
  const watchedApiEndpoints = watch('apiEndpoints');

  const onSubmit = useCallback(
    (data: TemplateFormValues) => {
      onSave(data);
    },
    [onSave],
  );

  // Build preview srcdoc
  const previewSrcDoc = useMemo(() => {
    const endpointLabels = watchedApiEndpoints
      .map((ep) => getDataSourceById(ep)?.label ?? ep)
      .join(', ');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
 body { font-family: system-ui, sans-serif; padding: 12px; margin: 0; }
 ${watchedCss}
</style>
</head>
<body>
${watchedTemplate || '<p style="color:#999">Enter template HTML above...</p>'}
<script>
 // Simulated data context
 window.__WIDGET_DATA__ = ${JSON.stringify(MOCK_PREVIEW_DATA)};
 window.__ENDPOINTS__ = ${JSON.stringify(endpointLabels)};
</script>
</body>
</html>`;
  }, [watchedTemplate, watchedCss, watchedApiEndpoints]);

  const availableEndpoints = useMemo(
    () => DATA_SOURCE_REGISTRY.map((ds) => ({ id: ds.id, label: ds.label })),
    [],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        {/* Left column: form fields */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Widget Title"
                  fullWidth
                  required
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  placeholder="Optional description"
                />
              )}
            />

            <Box>
              <Controller
                name="template"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="HTML Template"
                    fullWidth
                    multiline
                    minRows={8}
                    maxRows={20}
                    error={!!errors.template}
                    helperText={
                      errors.template?.message ??
                      `${field.value.length} / ${TEMPLATE_MAX_SIZE} characters`
                    }
                    slotProps={{
                      input: {
                        sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                      },
                    }}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Available variables: {'{{data.*}}'}, {'{{config.*}}'}, {'{{theme.*}}'}
              </Typography>
            </Box>

            <Box>
              <Controller
                name="css"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Custom CSS"
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={12}
                    error={!!errors.css}
                    helperText={
                      errors.css?.message ??
                      `${field.value.length} / ${CSS_MAX_SIZE} characters`
                    }
                    slotProps={{
                      input: {
                        sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="apiEndpoints"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={availableEndpoints}
                    getOptionLabel={(opt) => opt.label}
                    value={availableEndpoints.filter((ep) => field.value.includes(ep.id))}
                    onChange={(_, newValue) => {
                      field.onChange(newValue.map((v) => v.id));
                    }}
                    limitTags={3}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="API Endpoints"
                        placeholder="Select endpoints"
                        error={!!errors.apiEndpoints}
                        helperText={
                          errors.apiEndpoints?.message ??
                          `${field.value.length} / ${MAX_API_ENDPOINTS} endpoints`
                        }
                      />
                    )}
                  />
                )}
              />
              {watchedApiEndpoints.length > 0 && (
                <Alert severity="info" variant="outlined" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption">
                    Whitelisted: {watchedApiEndpoints.map((ep) => getDataSourceById(ep)?.endpoint ?? ep).join(', ')}
                  </Typography>
                </Alert>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Refresh Interval</Typography>
              <Typography variant="caption" color="text.secondary">
                Template widgets use a default 30s refresh interval. Configure per-endpoint in the template code.
              </Typography>
            </Box>
          </Stack>
        </Grid>

        {/* Right column: preview iframe */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Live Preview
            </Typography>
            <Box
              component="iframe"
              srcDoc={previewSrcDoc}
              sandbox="allow-scripts"
              title="Template preview"
              sx={{
                width: '100%',
                flex: 1,
                minHeight: 250,
                border: 'none',
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={!isValid}>
          Save Widget
        </Button>
      </Stack>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Component: WidgetBuilderTab
// ---------------------------------------------------------------------------

export function WidgetBuilderTab() {
  const customWidgets = useConfigStore((s) => s.config.dashboard.customWidgets ?? []);
  const addCustomWidget = useConfigStore((s) => s.addCustomWidget);
  const updateCustomWidget = useConfigStore((s) => s.updateCustomWidget);
  const removeCustomWidget = useConfigStore((s) => s.removeCustomWidget);
  const { enqueueSnackbar } = useSnackbar();

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingWidget, setEditingWidget] = useState<CustomWidget | null>(null);
  const [selectedType, setSelectedType] = useState<WidgetType>('config');

  const handleAdd = useCallback(() => {
    setEditingWidget(null);
    setSelectedType('config');
    setView('create');
  }, []);

  const handleEdit = useCallback((widget: CustomWidget) => {
    setEditingWidget(widget);
    setSelectedType(widget.type);
    setView('edit');
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      removeCustomWidget(id);
      enqueueSnackbar('Widget deleted', { variant: 'success' });
    },
    [removeCustomWidget, enqueueSnackbar],
  );

  const handleCancel = useCallback(() => {
    setEditingWidget(null);
    setView('list');
  }, []);

  const handleSaveConfig = useCallback(
    (values: ConfigFormValues) => {
      const fieldMapping: Record<string, string> = {};
      for (const fm of values.fieldMappings) {
        if (fm.apiField && fm.displayField) {
          fieldMapping[fm.displayField] = fm.apiField;
        }
      }

      const widget: ConfigWidget = {
        id: editingWidget?.id ?? generateId(),
        type: 'config',
        title: values.title,
        description: values.description || undefined,
        dataSource: values.dataSource,
        displayType: values.displayType,
        refreshInterval: values.refreshInterval,
        accentColor: values.accentColor || undefined,
        fieldMapping: Object.keys(fieldMapping).length > 0 ? fieldMapping : undefined,
        thresholds:
          values.thresholds.length > 0
            ? values.thresholds.map((t) => ({
                value: t.value,
                color: t.color,
                label: t.label || undefined,
              }))
            : undefined,
      };

      if (editingWidget) {
        updateCustomWidget(editingWidget.id, widget);
        enqueueSnackbar('Widget updated', { variant: 'success' });
      } else {
        addCustomWidget(widget);
        enqueueSnackbar('Widget created', { variant: 'success' });
      }

      handleCancel();
    },
    [editingWidget, addCustomWidget, updateCustomWidget, enqueueSnackbar, handleCancel],
  );

  const handleSaveTemplate = useCallback(
    (values: TemplateFormValues) => {
      const widget: TemplateWidget = {
        id: editingWidget?.id ?? generateId(),
        type: 'template',
        title: values.title,
        description: values.description || undefined,
        template: values.template,
        css: values.css || undefined,
        apiEndpoints: values.apiEndpoints.length > 0 ? values.apiEndpoints : undefined,
        refreshInterval: 30,
      };

      if (editingWidget) {
        updateCustomWidget(editingWidget.id, widget);
        enqueueSnackbar('Widget updated', { variant: 'success' });
      } else {
        addCustomWidget(widget);
        enqueueSnackbar('Widget created', { variant: 'success' });
      }

      handleCancel();
    },
    [editingWidget, addCustomWidget, updateCustomWidget, enqueueSnackbar, handleCancel],
  );

  // --- Render ---

  if (view === 'list') {
    return (
      <WidgetListView
        widgets={customWidgets}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }

  // Create or Edit mode
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {view === 'edit' ? 'Edit Widget' : 'Create New Widget'}
      </Typography>

      {/* Type selector - only shown during create */}
      {view === 'create' && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: selectedType === 'config' ? 'primary.main' : 'divider',
                borderWidth: selectedType === 'config' ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => setSelectedType('config')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DashboardIcon color={selectedType === 'config' ? 'primary' : 'disabled'} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      Config-Driven
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a data source and display type. No coding required.
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: selectedType === 'template' ? 'primary.main' : 'divider',
                borderWidth: selectedType === 'template' ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => setSelectedType('template')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CodeIcon color={selectedType === 'template' ? 'primary' : 'disabled'} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      Template-Based
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Write custom HTML/CSS with access to API data.
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Render appropriate form */}
      {selectedType === 'config' ? (
        <ConfigWidgetForm
          initialValues={editingWidget?.type === 'config' ? editingWidget : undefined}
          onSave={handleSaveConfig}
          onCancel={handleCancel}
        />
      ) : (
        <TemplateWidgetForm
          initialValues={editingWidget?.type === 'template' ? editingWidget : undefined}
          onSave={handleSaveTemplate}
          onCancel={handleCancel}
        />
      )}
    </Box>
  );
}