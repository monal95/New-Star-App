# 📊 Analytics Dashboard - Complete Implementation Guide

## Overview

The Analytics Dashboard is a modern, professional SaaS-style analytics platform built into the Smart Tailoring Management System. It provides comprehensive business intelligence with KPI cards, interactive charts, and advanced analytics tables.

## 🎯 Features

### 1. **KPI Cards** - Real-time Business Metrics

Four key performance indicator cards in a responsive grid:

| Card              | Icon           | Metric                | API Endpoint                    |
| ----------------- | -------------- | --------------------- | ------------------------------- |
| Total Orders      | 🛍️ ShoppingBag | Number of orders      | `/api/analytics/orders-count`   |
| Revenue Generated | 💵 DollarSign  | Total revenue         | `/api/analytics/revenue`        |
| Active Customers  | 👥 Users       | Active customer count | `/api/analytics/customers`      |
| Pending Orders    | ⏰ Clock       | Awaiting completion   | `/api/analytics/pending-orders` |

Each card shows:

- Metric value
- Growth percentage
- Trend indicator (↑ up or ↓ down)
- Color-coded growth (🟢 Green for positive, 🔴 Red for negative)

### 2. **Interactive Charts** - Data Visualization

#### Charts Row 1:

- **Monthly Revenue** (Left)
  - Embedded Metabase iframe
  - Interactive revenue tracking
  - Source: `http://localhost:3001/public/dashboard/revenue-chart`

- **Orders by Dress Type** (Right)
  - Recharts PieChart
  - Shows order distribution:
    - Shirt
    - Pants
    - Blazer
    - Uniform
    - Saree Blouse
    - Others
  - Interactive legend
  - Hover tooltips

#### Charts Row 2:

- **Orders Trend** (Left)
  - Recharts LineChart
  - Daily order trends
  - Date range responsive
  - Smooth animations

- **Tailor Productivity** (Right)
  - Recharts BarChart
  - Orders completed per tailor
  - Sortable data
  - Performance comparison

### 3. **Filter Panel** - Dynamic Data Filtering

Control what data is displayed with 4 filter options:

```
┌─────────────────┬─────────────────┬─────────────────┬──────────────────┐
│  Date Range     │  Dress Type     │  Tailor         │  Order Status    │
├─────────────────┼─────────────────┼─────────────────┼──────────────────┤
│ • Today         │ • All Types     │ • All Tailors   │ • All Status     │
│ • Last 7 Days   │ • Shirt         │ • Sanjay        │ • Pending        │
│ • Last 30 Days  │ • Pants         │ • Anwar         │ • In Progress    │
│ • Custom Range  │ • Blazer        │ • Dhana         │ • Completed      │
│                 │ • Uniform       │ • Ramesh        │                  │
│                 │ • Saree Blouse  │ • Vikram        │                  │
│                 │ • Others        │                 │                  │
└─────────────────┴─────────────────┴─────────────────┴──────────────────┘
```

All charts update dynamically based on filter selections.

### 4. **Advanced Analytics Table** - Recent Orders

Comprehensive table with powerful features:

#### Columns:

| Column          | Type   | Sortable |
| --------------- | ------ | -------- |
| Order ID        | String | ✅ Yes   |
| Customer Name   | String | ✅ Yes   |
| Dress Type      | String | ❌ No    |
| Assigned Tailor | String | ❌ No    |
| Order Price     | Number | ✅ Yes   |
| Status          | Badge  | ❌ No    |
| Delivery Date   | Date   | ✅ Yes   |

#### Features:

- **Search**: Filter by Order ID, Customer Name, Dress Type
- **Sorting**: Click column header to sort (ascending/descending)
- **Pagination**: 10 items per page with page navigation
- **Status Badges**: Color-coded order status
  - 🟨 Pending: Yellow (#fef3c7)
  - 🔵 In Progress: Blue (#dbeafe)
  - 🟢 Completed: Green (#dcfce7)
- **Row Hover**: Highlight rows on hover for better UX

### 5. **Embedded Analytics** - Advanced Business Insights

Below the table:

- Full Metabase dashboard embed
- Height: 500px
- Title: "Advanced Business Insights"
- Source: `http://localhost:3001/public/dashboard/tailoring-business-insights`
- Shows comprehensive Metabase metrics

### 6. **Header Controls**

Top navigation with quick actions:

```
┌────────────────────────────────────────────────────────────────┐
│  Analytics Dashboard                                           │
│  Track your tailoring business performance                    │
│                                              [Date▼] [🔄] [⬇️] │
└────────────────────────────────────────────────────────────────┘
```

- **Date Range Selector**: Quick date filtering
- **Refresh Button**: Reload latest analytics
- **Export Button**: Download report as CSV

## 🛠️ Technical Implementation

### Component Structure

```
components/Analytics/
├── KPICard.jsx                    # Individual metric card
│   ├── Displays value, title, growth
│   └── Loading skeleton support
│
├── RevenueChart.jsx               # Metabase iframe wrapper
│
├── DressTypePieChart.jsx          # Recharts PieChart
│   ├── 6 dress type categories
│   └── Color-coded segments
│
├── OrdersTrendChart.jsx           # Recharts LineChart
│   ├── Daily order trends
│   └── Date range responsive
│
├── TailorBarChart.jsx             # Recharts BarChart
│   ├── Tailor performance
│   └── Sortable data
│
├── OrdersAnalyticsTable.jsx       # Advanced data table
│   ├── Search functionality
│   ├── Sorting (6 columns)
│   ├── Pagination (10 per page)
│   └── Status badges
│
└── MetabaseEmbed.jsx              # Reusable iframe component

pages/
└── AnalyticsDashboard.jsx         # Main dashboard page
    ├── State management
    ├── Data fetching
    ├── Filter coordination
    └── Layout orchestration
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│           AnalyticsDashboard (State)                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │ dateRange, dressType, tailor, orderStatus, loading ││
│  └─────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────────┐
         │             │                 │
         ↓             ↓                 ↓
    ┌─────────┐  ┌──────────┐    ┌─────────────┐
    │ KPI     │  │ Charts   │    │ Filter      │
    │ Cards   │  │ (4 types)│    │ Panel       │
    └─────────┘  └──────────┘    └─────────────┘
         │             │                 │
         └─────────────┼─────────────────┘
                       │
                       ↓
                ┌─────────────────┐
                │ Analytics Table │
                │ & Metabase      │
                └─────────────────┘
```

### State Management Example

```jsx
const [dateRange, setDateRange] = useState("7days");
const [dressTypeFilter, setDressTypeFilter] = useState("all");
const [tailorFilter, setTailorFilter] = useState("all");
const [orderStatusFilter, setOrderStatusFilter] = useState("all");
const [isLoading, setIsLoading] = useState(false);

// Data fetching with filter dependencies
useEffect(() => {
  fetchAnalyticsData();
}, [dateRange, dressTypeFilter, tailorFilter, orderStatusFilter]);
```

## 🎨 Styling & Theme

### Color Palette

- **Primary**: Royal Blue (#1e40af)
- **Accent**: Light Blue (#60a5fa, #93c5fd)
- **Background**: White (#ffffff), Slate (#f8fafc)
- **Text**: Dark Slate (#1e293b), Medium Slate (#64748b)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Danger**: Red (#ef4444)

### Design Language

- **Cards**: bg-white, rounded-xl, shadow-md, border border-slate-200
- **Buttons**:
  - Primary: bg-blue-900 hover:bg-blue-800
  - Secondary: bg-slate-100 hover:bg-slate-200
- **Hover**: 0.3-0.5s transition, shadow-md → shadow-lg
- **Spacing**: gap-6 for grid layouts
- **Typography**:
  - Headings: font-bold, text-slate-900
  - Body: font-medium, text-slate-600

## 📡 API Integration

### Implementation Steps

1. **Replace Mock Data with API Calls**:

```jsx
useEffect(() => {
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Replace these with actual API calls
      const ordersRes = await fetch("/api/analytics/orders-count");
      const orders = await ordersRes.json();

      const revenueRes = await fetch("/api/analytics/revenue");
      const revenue = await revenueRes.json();

      setKpiData({
        totalOrders: { value: orders.count, growth: orders.growth },
        revenue: { value: revenue.total, growth: revenue.growth },
        // ... other metrics
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchAnalyticsData();
}, [dateRange, dressTypeFilter, tailorFilter, orderStatusFilter]);
```

2. **Required Backend Endpoints**:
   - `GET /api/analytics/orders-count?dateRange=...&filters=...`
   - `GET /api/analytics/revenue?dateRange=...&filters=...`
   - `GET /api/analytics/customers?dateRange=...&filters=...`
   - `GET /api/analytics/pending-orders?dateRange=...&filters=...`
   - `GET /api/analytics/orders-trend?dateRange=...&filters=...`
   - `GET /api/analytics/dress-types?dateRange=...&filters=...`
   - `GET /api/analytics/tailor-productivity?dateRange=...&filters=...`
   - `GET /api/analytics/recent-orders?page=...&limit=...&sort=...`

## 🚀 Usage Guide

### Accessing the Dashboard

1. Log in to the Admin Panel
2. Click "Analytics Dashboard" in the sidebar
3. Dashboard loads with default data (Last 7 days)

### Navigation

```
Sidebar → Analytics Dashboard
└── Header: Track your tailoring business performance
    ├── KPI Cards: 4 metric cards
    ├── Filter Panel: Adjust data view
    ├── Charts Row 1: Revenue + Orders by Type
    ├── Charts Row 2: Orders Trend + Tailor Productivity
    ├── Analytics Table: Recent orders with search/sort
    └── Metabase Embed: Advanced insights
```

### Using Filters

1. **Select Date Range**:
   - Today: Current day only
   - Last 7 Days: Previous 7 days (default)
   - Last 30 Days: Previous 30 days
   - Custom Range: Select specific dates

2. **Filter by Dress Type**:
   - All Types (default)
   - Individual dress types

3. **Filter by Tailor**:
   - All Tailors (default)
   - Specific tailor names

4. **Filter by Status**:
   - All Status (default)
   - Pending, In Progress, Completed

**💡 Tip**: Filters are cumulative. Select multiple filters to narrow down data.

### Exporting Data

1. Click **"Export"** button in header
2. CSV file downloads automatically
3. Filename format: `analytics-report-YYYY-MM-DD.csv`

### Refreshing Data

1. Click **"Refresh"** button (🔄 icon)
2. All charts and metrics reload
3. Latest data from API displayed

### Interacting with Charts

- **Hover**: View detailed tooltips
- **Legend**: Click to toggle series visibility
- **Pie Chart**: Click segments to highlight
- **Line/Bar**: Hover for exact values

### Table Operations

**Search**:

- Type in search box
- Real-time filtering as you type

**Sort**:

- Click column header to sort
- Click again to reverse sort
- Sorted column shows sort indicator (↑ or ↓)

**Paginate**:

- Select page number (1-N)
- Use Previous/Next buttons
- Shows current item range

## 🔧 Customization

### Changing Colors

Edit theme values in component files:

```jsx
// KPICard.jsx
const CARD_COLORS = {
  background: '#ffffff',
  border: '#e2e8f0',
  icon: '#dbeafe',
  text: '#1e293b'
};

// Charts
const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', ...];
```

### Adjusting Item Counts

```jsx
// OrdersAnalyticsTable.jsx
const itemsPerPage = 10; // Change pagination size
```

### Chart Heights

```jsx
// Component props
<DressTypePieChart height={350} />  // Default 350px
<OrdersTrendChart height={350} />
```

### Metabase URLs

Update in `MetabaseEmbed.jsx`:

```jsx
source = "http://your-metabase:3001/public/dashboard/revenue-chart";
source = "http://your-metabase:3001/public/dashboard/business-insights";
```

## 📱 Responsive Behavior

| Screen Size           | Behavior                                      |
| --------------------- | --------------------------------------------- |
| Mobile (<768px)       | Single column layouts, stacked cards          |
| Tablet (768px-1024px) | 2-column grids for charts, single column KPIs |
| Desktop (>1024px)     | Full 4-column KPI grid, 2-column chart grid   |
| Extra Large (>1280px) | All optimizations applied                     |

## ⚡ Performance Tips

1. **Use useMemo** for expensive calculations
2. **Lazy load** Metabase iframes
3. **Implement** virtual scrolling for large tables
4. **Cache** API responses
5. **Debounce** filter changes

## 🐛 Troubleshooting

### Charts Not Displaying

- Check Recharts installation: `npm list recharts`
- Verify data array format matches expected structure
- Check browser console for errors

### Metabase Embeds Not Loading

- Verify Metabase server is running at `http://localhost:3001`
- Check iframe URLs are correct
- Ensure CORS is enabled on Metabase
- Check browser network tab

### Filters Not Working

- Verify `useEffect` dependencies array includes filter states
- Check API responses to filter queries
- Ensure component receives filter props

### Table Search Not Working

- Check search input value state updates
- Verify useMemo filter logic
- Clear browser cache if needed

## 📚 Additional Resources

- [Recharts Documentation](https://recharts.org/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [React Hooks Guide](https://react.dev/reference/react/hooks)
- [Metabase Embedding](https://www.metabase.com/docs/latest/embedding/embedding-overview)

## 🎓 Learning Path

1. **Basics**: Understand the component structure
2. **Integration**: Connect API endpoints
3. **Customization**: Adjust colors and layouts
4. **Enhancement**: Add filters and sorting
5. **Optimization**: Improve performance

---

**Status**: ✅ Complete  
**Last Updated**: March 2026  
**Version**: 1.0.0
