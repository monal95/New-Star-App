# Analytics Dashboard - Smart Tailoring Management System

A modern, professional SaaS-style Analytics Dashboard built with React, TailwindCSS, and Recharts.

## 📁 Project Structure

```
src/
├── components/
│   └── Analytics/
│       ├── KPICard.jsx              # KPI metric cards with growth indicators
│       ├── RevenueChart.jsx          # Embedded Metabase revenue chart
│       ├── DressTypePieChart.jsx     # Pie chart for orders by dress type
│       ├── OrdersTrendChart.jsx      # Line chart for daily order trends
│       ├── TailorBarChart.jsx        # Bar chart for tailor productivity
│       ├── OrdersAnalyticsTable.jsx  # Advanced analytics table with sorting & pagination
│       └── MetabaseEmbed.jsx         # Reusable Metabase iframe embed component
├── pages/
│   └── AnalyticsDashboard.jsx        # Main dashboard page
└── App.jsx                           # Updated with Analytics integration
```

## 🎨 Design Features

- **Professional UI**: Clean, modern SaaS-style interface
- **Responsive Layout**: Works seamlessly on mobile, tablet, and desktop
- **Color Theme**: Uses the existing royal blue theme (#1e40af) with slate grays
- **Soft Shadows**: Subtle shadow effects on cards (shadow-md)
- **Rounded Cards**: Consistent border-radius (rounded-xl)
- **Hover Effects**: Interactive hover states on cards and buttons
- **Smooth Animations**: Chart animations and skeleton loaders

## 📊 Dashboard Sections

### 1. Header Section

- Page title and subtitle
- Date range picker (Today / Last 7 days / Last 30 days / Custom)
- Refresh Analytics button
- Export Report button

### 2. KPI Cards (4 metrics)

- **Total Orders**: ShoppingBag icon
- **Revenue Generated**: DollarSign icon
- **Active Customers**: Users icon
- **Pending Orders**: Clock icon

Each card displays:

- Metric value
- Growth percentage (positive/negative)
- Trend indicator

### 3. Filter Panel

Filters that dynamically update charts:

- Date Range selector
- Dress Type dropdown
- Tailor selection
- Order Status dropdown

### 4. Analytics Charts

#### First Row (2 columns)

- **Monthly Revenue**: Embedded Metabase iframe
- **Orders by Dress Type**: Recharts PieChart

Shows distribution of orders across dress types:

- Shirt, Pants, Blazer, Uniform, Saree Blouse, Others

#### Second Row (2 columns)

- **Orders Trend**: Recharts LineChart
  - Shows orders per day for selected date range
- **Tailor Productivity**: Recharts BarChart
  - Shows orders completed per tailor

### 5. Recent Orders Analytics Table

Advanced table with:

- **Columns**: Order ID, Customer, Dress Type, Tailor, Price, Status, Delivery Date
- **Features**:
  - Search/filter by Order ID, Customer Name, Dress Type
  - Column sorting (click header to sort)
  - Pagination (10 items per page)
  - Status badges with color coding
  - Sticky header on scroll

Status Badge Colors:

- Pending → Yellow (#fef3c7)
- In Progress → Blue (#dbeafe)
- Completed → Green (#dcfce7)

### 6. Metabase Embedded Analytics

Below the table:

- **Advanced Business Insights** section
- Embedded Metabase dashboard
- Height: 500px
- Title: "Advanced Business Insights"

## 🔌 API Integration

The dashboard supports integration with the following API endpoints:

```
GET /api/analytics/orders-count        → Total Orders count
GET /api/analytics/revenue             → Revenue Generated
GET /api/analytics/customers           → Active Customers count
GET /api/analytics/pending-orders      → Pending Orders count
GET /api/analytics/orders-trend        → Orders trend data (line chart)
GET /api/analytics/dress-types         → Orders by dress type (pie chart)
GET /api/analytics/tailor-productivity → Tailor productivity (bar chart)
GET /api/analytics/recent-orders       → Recent orders for table
```

## 🚀 Usage

### Access the Dashboard

Navigate to the Analytics Dashboard via the sidebar. Click on "Analytics Dashboard" in the main navigation.

### Date Range Filtering

Select from predefined ranges or choose custom dates. All charts and KPIs automatically update based on selected range.

### Filtering Data

Use the filter panel to refine data by:

- Dress type
- Assigned tailor
- Order status

### Exporting Data

Click "Export" button to download report as CSV format.

### Refreshing Data

Click "Refresh" button to reload all analytics data from the API.

## 📈 Data Visualization

### Charts Used

- **LineChart** (Recharts): For trend analysis
- **PieChart** (Recharts): For categorical distribution
- **BarChart** (Recharts): For comparison across categories

### Interactive Features

- Hover tooltips on all charts
- Zoom/pan capabilities (via Recharts)
- Series highlighting
- Responsive legend

## 🎯 Skeleton Loaders

All components display skeleton loaders while data is being fetched:

- KPI cards show animated placeholders
- Charts show full-height animated backgrounds
- Table shows skeleton rows

## 💡 Component Customization

### KPICard Props

```jsx
<KPICard
  icon={IconComponent} // Lucide React icon
  title="Metric Title" // Display title
  value={1234} // Metric value
  growth={12} // Growth percentage
  trend="up" // 'up' or 'down'
  isLoading={false} // Show skeleton loader
/>
```

### Chart Components

All chart components accept:

- `data`: Array of data objects
- `isLoading`: Boolean for skeleton state

### MetabaseEmbed Props

```jsx
<MetabaseEmbed
  title="Chart Title"
  source="http://localhost:3001/public/dashboard/..."
  height={350}
  isLoading={false}
/>
```

## 🎨 Theme Configuration

The dashboard uses the existing app theme:

- **Primary Blue**: #1e40af
- **Secondary Blue**: #3b82f6, #60a5fa
- **Background**: #f8fafc (White #ffffff)
- **Text**: #1e293b (Dark slate)
- **Border**: #e2e8f0 (Light slate)
- **Success**: #22c55e (Green)
- **Warning**: #f59e0b (Amber)
- **Danger**: #ef4444 (Red)

## ⚙️ Configuration

### Metabase URLs

Update iframe sources in MetabaseEmbed components:

```jsx
source = "http://localhost:3001/public/dashboard/revenue-chart";
source = "http://localhost:3001/public/dashboard/tailoring-business-insights";
```

### Items Per Page

Change pagination size in `OrdersAnalyticsTable.jsx`:

```jsx
const itemsPerPage = 10; // Modify as needed
```

## 🔄 State Management

The dashboard uses React hooks for state management:

- `useState` for filters and loading states
- `useMemo` for memoized computations (sorting, filtering, pagination)
- `useEffect` for data fetching

## 📱 Responsive Breakpoints

- **Mobile**: Single column layouts
- **Tablet** (md): 2-column grids
- **Desktop** (lg): 4-column grids for KPIs, 2-column layouts for charts

## 🛠️ Dependencies

- **React**: ^19.2.0
- **TailwindCSS**: ^4.1.18
- **Recharts**: ^2.12.0+ (newly added)
- **Lucide React**: ^0.563.0
- **React DOM**: ^19.2.0

## 📝 Notes

1. Mock data is currently used. Replace with actual API calls in the `useEffect` hook.
2. All date range filtering should be implemented in the backend API.
3. Metabase URLs should be updated based on your Metabase instance.
4. Consider adding real-time updates using WebSockets for live metrics.

## 🚀 Future Enhancements

- [ ] Real-time data updates with WebSockets
- [ ] Custom date range picker
- [ ] Data export to multiple formats (Excel, PDF)
- [ ] Email report scheduling
- [ ] Advanced filtering options
- [ ] Drill-down capabilities on charts
- [ ] Custom metric calculations
- [ ] Performance optimizations with virtualization

---

**Version**: 1.0.0  
**Last Updated**: March 2026
