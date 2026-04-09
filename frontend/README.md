# Kinerja Ruas Jalan - Traffic Monitoring System

A comprehensive React + Tailwind CSS application for traffic road segment performance monitoring in Indonesia, implementing the PKJI 2023 (Indonesian Highway Capacity Manual) standards.

## Features

✅ **Complete Authentication System**
- Login page with form validation
- Protected routes
- User session management

✅ **8 Full Pages**
1. **Login** - User authentication with gradient design
2. **Dashboard** - Real-time traffic statistics with charts
3. **Deteksi** - Video upload and YOLOv8 detection results
4. **Perhitungan** - PKJI 2023 capacity calculations with LOS determination
5. **Histori** - Analysis history with pagination and filtering
6. **HistoriDetail** - Detailed analysis results with export options
7. **InformasiWebsite** - Website and developer information
8. **PetunjukPenggunaan** - User guide and FAQ

✅ **Advanced Features**
- Real-time traffic data visualization with Recharts
- Level of Service (LOS) classification (A-F)
- Degree of Saturation (DJ) calculation
- 24-hour traffic volume analysis
- Interactive data tables with pagination
- Export to PDF/CSV functionality
- Responsive design for desktop and tablet
- Automatic status tracking

✅ **UI Components**
- Button (multiple variants and sizes)
- Card (reusable container)
- Table (striped, hover effects)
- Stats Card (metric display)
- Charts (Line chart, Donut chart)

## Technology Stack

- **Frontend Framework**: React 18
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v6
- **Charts**: Recharts 2
- **State Management**: React Hooks (useState)
- **Build Tool**: Vite

## Project Structure

```
kinerja-ruas-jalan/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── Dashboard/
│   │   │   ├── StatsCard.jsx
│   │   │   ├── LOSDonutChart.jsx
│   │   │   └── TrafficLineChart.jsx
│   │   └── UI/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── Table.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Deteksi.jsx
│   │   ├── Perhitungan.jsx
│   │   ├── Histori.jsx
│   │   ├── HistoriDetail.jsx
│   │   ├── InformasiWebsite.jsx
│   │   └── PetunjukPenggunaan.jsx
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

### Login
- Visit the application and use any email/password combination
- Click "Masuk" to authenticate

### Dashboard
- View real-time traffic statistics
- Monitor Level of Service distribution
- Analyze 24-hour traffic patterns

### Deteksi
- Upload video files for YOLOv8 detection
- View detection results in table format
- Export results as CSV

### Perhitungan
- Input road segment parameters
- Calculate capacity using PKJI 2023 formulas
- Determine Level of Service
- Export results as PDF

### Histori
- View all previous analyses
- Paginate through historical records
- Access detailed results

### Informasi & Petunjuk
- Learn about the system
- Read comprehensive user guides
- Access developer information

## Color Scheme

- **Primary**: `#2563EB` (Blue)
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Yellow)
- **Danger**: `#EF4444` (Red)
- **Purple**: `#8B5CF6` (Purple)

## LOS Classification

| Level | DJ Range | Status |
|-------|----------|--------|
| A | 0.00-0.25 | Flow free |
| B | 0.25-0.50 | Stable |
| C | 0.50-0.75 | Stable with restrictions |
| D | 0.75-0.85 | Unstable |
| E | 0.85-1.00 | Highly unstable |
| F | >1.00 | Forced flow |

## Component Props

### Button
```jsx
<Button 
  variant="primary" // primary | success | warning | danger | secondary | outline
  size="md" // sm | md | lg
  className="" // additional classes
  disabled={false}
>
  Button Text
</Button>
```

### Card
```jsx
<Card className="">
  Content
</Card>
```

### Table
```jsx
<Table 
  columns={[
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: (value) => <span>{value}</span> }
  ]}
  data={[...]}
  striped={true}
/>
```

### StatsCard
```jsx
<StatsCard 
  title="Title" 
  value="99" 
  icon="🚗" 
  subtitle="Subtitle"
/>
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

© 2025 Politeknik Keselamatan Transportasi Jalan (PKTJ)

## Support

For technical support or inquiries, contact the development team.

---

**Developer**: Yunindra Eka Ariffansyah
**Institution**: PKTJ Tegal Angkatan XXXII
**Last Updated**: December 2025
