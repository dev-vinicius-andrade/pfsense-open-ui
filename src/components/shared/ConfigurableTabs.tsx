import { useMemo } from 'react';
import { Box, Tab, Tabs, type SxProps, type Theme, type TabsProps } from '@mui/material';
import { useConfigStore } from '@/stores/configStore';

export interface TabItem {
 id: string;
 label: string;
 icon?: React.ElementType;
}

interface ConfigurableTabsProps {
 tabs: readonly TabItem[];
 activeTab: string;
 onTabChange: (tabId: string) => void;
 children: React.ReactNode;
 ariaLabel?: string;
 variant?: TabsProps['variant'];
 scrollButtons?: TabsProps['scrollButtons'];
}

type TabOrientation = 'top' | 'bottom' | 'left' | 'right';

const VERTICAL_TAB_WIDTH = 180;

function getContainerFlexDirection(orientation: TabOrientation): React.CSSProperties['flexDirection'] {
 switch (orientation) {
 case 'bottom':
 return 'column-reverse';
 case 'left':
 return 'row';
 case 'right':
 return 'row-reverse';
 case 'top':
 default:
 return 'column';
 }
}

function isVertical(orientation: TabOrientation): boolean {
 return orientation === 'left' || orientation === 'right';
}

export function ConfigurableTabs({
 tabs,
 activeTab,
 onTabChange,
 children,
 ariaLabel,
 variant = 'scrollable',
 scrollButtons = 'auto',
}: ConfigurableTabsProps) {
 const tabOrientation = useConfigStore((s) => s.config.layout.tabOrientation) ?? 'top';

 const vertical = isVertical(tabOrientation);
 const flexDirection = getContainerFlexDirection(tabOrientation);

 const handleChange = useMemo(
 () => (_event: React.SyntheticEvent, newValue: string) => {
 onTabChange(newValue);
 },
 [onTabChange],
 );

 const tabsSx = useMemo<SxProps<Theme>>(() => {
 if (vertical) {
 return {
 width: VERTICAL_TAB_WIDTH,
 flexShrink: 0,
 borderRight: tabOrientation === 'left' ? 1 : 'none',
 borderLeft: tabOrientation === 'right' ? 1 : 'none',
 borderColor: 'divider',
 '& .MuiTabs-flexContainer': {
 flexDirection: 'column',
 },
 '& .MuiTabs-indicator': {
 right: tabOrientation === 'left' ? 0 : undefined,
 left: tabOrientation === 'right' ? 0 : undefined,
 width: 2,
 height: 'auto',
 },
 overflowY: 'auto',
 maxHeight: 'calc(100vh - 200px)',
 };
 }
 return {
 borderBottom: tabOrientation === 'top' ? 1 : 'none',
 borderTop: tabOrientation === 'bottom' ? 1 : 'none',
 borderColor: 'divider',
 };
 }, [vertical, tabOrientation]);

 const contentSx = useMemo<SxProps<Theme>>(() => {
 if (vertical) {
 return {
 flexGrow: 1,
 minWidth: 0,
 overflow: 'auto',
 };
 }
 return {
 width: '100%',
 };
 }, [vertical]);

 return (
 <Box
 sx={{
 display: 'flex',
 flexDirection,
 transition: 'flex-direction 0.3s ease',
 }}
 >
 <Tabs
 value={activeTab}
 onChange={handleChange}
 orientation={vertical ? 'vertical' : 'horizontal'}
 variant={vertical ? 'standard' : variant}
 scrollButtons={vertical ? undefined : scrollButtons}
 indicatorColor="primary"
 textColor="primary"
 aria-label={ariaLabel}
 sx={tabsSx}
 >
 {tabs.map((tab) => (
 <Tab
 key={tab.id}
 value={tab.id}
 label={tab.label}
 icon={tab.icon ? <tab.icon /> : undefined}
 iconPosition={vertical ? 'start' : 'top'}
 id={`configurable-tab-${tab.id}`}
 aria-controls={`configurable-tabpanel-${tab.id}`}
 sx={vertical ? { justifyContent: 'flex-start', textAlign: 'left' } : undefined}
 />
 ))}
 </Tabs>

 <Box
 role="tabpanel"
 id={`configurable-tabpanel-${activeTab}`}
 aria-labelledby={`configurable-tab-${activeTab}`}
 sx={contentSx}
 >
 {children}
 </Box>
 </Box>
 );
}