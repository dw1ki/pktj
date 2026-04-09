# 🧩 Component Documentation

## Layout Components

### Layout.jsx
Main layout wrapper that combines Sidebar, Header, Footer with main content area.
- Props: `children` (ReactNode)
- Features: Flex layout, padding, overflow handling

### Sidebar.jsx
Left navigation bar with menu items and logout button.
- Fixed position: 240px width
- Menu items: Dashboard, Deteksi, Perhitungan, Histori, Informasi, Petunjuk
- Features: Active route highlighting, smooth transitions

### Header.jsx
Top navigation bar showing page title and user info.
- Features: Sticky positioning, user avatar, responsive design
- Dynamic page name based on current route

### Footer.jsx
Bottom footer with copyright information.
- Content: © 2025 Politeknik Keselamatan Transportasi Jalan

---

## UI Components

### Button.jsx
Reusable button component with multiple variants.

**Props:**
```jsx
{
  children: string | ReactNode,           // Button text or content
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'outline',
  size: 'sm' | 'md' | 'lg',
  className: string,                     // Additional CSS classes
  disabled: boolean,
  ...props                                // HTML button attributes
}
```

**Variants:**
- primary: Blue background
- success: Green background
- warning: Yellow background
- danger: Red background
- secondary: Gray background
- outline: Blue border with transparent background

**Sizes:**
- sm: Small padding and text
- md: Medium (default)
- lg: Large padding and text

### Card.jsx
Reusable card container with white background, shadow, and rounded corners.

**Props:**
```jsx
{
  children: ReactNode,
  className: string
}
```

**Styling:**
- White background
- Shadow effect
- Rounded corners (lg)
- Padding (6)

### Table.jsx
Data table component with pagination and custom rendering.

**Props:**
```jsx
{
  columns: Array<{
    key: string,
    label: string,
    render?: (value: any, row: any) => ReactNode
  }>,
  data: Array<any>,
  striped: boolean
}
```

**Features:**
- Striped rows (alternating colors)
- Hover effects on rows
- Custom cell rendering
- Responsive overflow handling
- Header styling

---

## Dashboard Components

### StatsCard.jsx
Metric card displaying a stat with icon and optional subtitle.

**Props:**
```jsx
{
  title: string,                  // Main label
  value: string | number,         // Main value
  icon: string,                   // Emoji or icon
  subtitle: string                // Optional subtitle
}
```

**Features:**
- Icon background color
- Clean typography hierarchy
- Flex layout for alignment

### LOSDonutChart.jsx
Donut chart showing Level of Service distribution.

**Data Structure:**
```jsx
[
  { name: 'A', value: 0 },
  { name: 'B', value: 0 },
  { name: 'C', value: 0 },
  { name: 'D', value: 0 },
  { name: 'E', value: 100 },
  { name: 'F', value: 0 }
]
```

**Features:**
- Recharts PieChart
- Custom color palette
- Legend display
- Tooltip on hover
- Color indicator grid below chart

### TrafficLineChart.jsx
Line chart showing 24-hour traffic volume.

**Data:**
- 24 data points (00:00 to 23:00)
- Volume in smp/jam (vehicle equivalents per hour)

**Features:**
- Recharts LineChart
- Reference lines (thresholds)
- Tooltip with custom formatting
- GridLines for readability
- Smooth curve rendering

---

## Page Components

### Login.jsx
Authentication page with dual-panel layout.

**Features:**
- Left panel: Blue gradient with stats
- Right panel: White card with login form
- Email and password inputs
- Form validation
- Redirect to /dashboard on submit

### Dashboard.jsx
Main dashboard page with statistics and charts.

**Content:**
- 3 statistics cards
- LOS distribution chart
- 24-hour traffic chart

### Deteksi.jsx
Video detection interface for YOLO analysis.

**Content:**
- Upload Video button
- Video player placeholder
- Results table (8 columns)
- Pagination controls
- Export CSV button

**Table Columns:**
1. No (row number)
2. Nama Video (filename)
3. Waktu Rekaman (time range)
4. Durasi (duration)
5. Total Mobil (vehicle count)
6. Avg Confidence (detection confidence)
7. Total Frame (frame count)
8. Status (completion status)

### Perhitungan.jsx
PKJI 2023 capacity calculation interface.

**Sections:**
1. **Left Form:**
   - Road parameters (nama, tipe, kapasitas, etc.)
   - Volume data (dari deteksi)
   
2. **Right Results:**
   - Formula display
   - Calculation results
   - Calculate button

3. **Conclusion:**
   - LOS badge
   - Stats grid
   - Export buttons

### Histori.jsx
History list page with pagination.

**Features:**
- Info banner
- History table (9 columns)
- Pagination controls
- Status badges (Draft/Verified)
- Action buttons

**Table Columns:**
1. No
2. Tanggal (date)
3. Nama Jalan (road name)
4. Waktu Rekaman (recording time)
5. Tipe Jalan (road type)
6. DJ (degree of saturation)
7. LOS (level of service)
8. Status
9. Aksi (actions)

### HistoriDetail.jsx
Detailed analysis results page.

**Content:**
1. **Header:**
   - Title and metadata
   - Export buttons
   - Back button

2. **Summary Cards:**
   - LOS level
   - DJ value
   - Volume (Q)
   - Capacity (C)
   - Duration

3. **Left Column:**
   - YOLO detection results
   - Capacity calculation breakdown
   - Level of Service description

4. **Right Column:**
   - Road parameters
   - DJ calculation
   - Detailed conclusion

### InformasiWebsite.jsx
Website information and developer details.

**Content:**
- Website description
- Developer information
- Technology stack

### PetunjukPenggunaan.jsx
User guide with instructions and FAQ.

**Content:**
1. YOLO Detection Steps (4 steps)
2. Capacity Calculation Steps (4 steps)
3. Tips Section
4. FAQ Section

---

## Mock Data

### Traffic Data (24 points)
```jsx
[
  { time: '00:00', volume: 120 },
  { time: '01:00', volume: 95 },
  ...
  { time: '23:00', volume: 140 }
]
```

### LOS Distribution
```jsx
[
  { name: 'A', value: 0 },
  { name: 'B', value: 0 },
  { name: 'C', value: 0 },
  { name: 'D', value: 0 },
  { name: 'E', value: 100 },
  { name: 'F', value: 0 }
]
```

### Detection Results (4 entries)
Columns: Video name, Time, Duration, Vehicle count, Confidence, Frames, Status

### History Data (4 entries)
Columns: Date, Road name, Time, Type, DJ, LOS, Status

---

## Styling Classes

### Tailwind Classes Used
- Layout: `flex`, `grid`, `w-`, `h-`, `p-`, `m-`
- Colors: `bg-`, `text-`, `border-`
- Effects: `shadow-`, `rounded-`, `opacity-`
- States: `hover:`, `disabled:`, `focus:`
- Responsive: `max-w-`, `@media`

### Custom CSS (in index.css)
- `.sidebar` - Fixed left navigation
- `.main-content` - Main content area
- `.page-container` - Page body
- Scrollbar styling

---

## Component Hierarchy

```
App (routing)
├── Login (no layout)
└── Layout (protected routes)
    ├── Sidebar
    ├── Header
    ├── Main Content
    │   ├── Dashboard
    │   │   ├── StatsCard
    │   │   ├── LOSDonutChart
    │   │   └── TrafficLineChart
    │   ├── Deteksi
    │   │   └── Table
    │   ├── Perhitungan
    │   │   ├── Card
    │   │   └── Button
    │   ├── Histori
    │   │   ├── Card
    │   │   └── Table
    │   ├── HistoriDetail
    │   │   ├── Card
    │   │   └── Button
    │   ├── InformasiWebsite
    │   │   └── Card
    │   └── PetunjukPenggunaan
    │       └── Card
    └── Footer
```

---

## PropTypes

All components have PropTypes validation defined:

```jsx
import PropTypes from 'prop-types'

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  prop3: PropTypes.func,
  // ...
}
```

---

**Last Updated**: December 2025
**Total Components**: 18
**Total Pages**: 8
