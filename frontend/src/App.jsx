import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [revenueData, setRevenueData] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)

  // Colors for the Pie Chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  useEffect(() => {
    // Fetch data from your FastAPI backend
    const fetchData = async () => {
      try {
        const [revenueRes, categoryRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/metrics/total-revenue'),
          fetch('http://127.0.0.1:8000/api/metrics/sales-by-category')
        ])

        const revenueJson = await revenueRes.json()
        const categoryJson = await categoryRes.json()

        setRevenueData(revenueJson)
        
        // Ensure data is formatted correctly for Recharts
        const formattedCategoryData = categoryJson.map(item => ({
          name: item.category,
          value: parseFloat(item.category_revenue)
        }))
        setCategoryData(formattedCategoryData)
        setLoading(false)

      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading VANAD Analytics...</div>

  return (
    <div className="dashboard-container">
      <h1>VANAD Analytics Dashboard</h1>
      
      {/* High-Level KPI Card */}
      <div className="kpi-card">
        <h2>Total Revenue</h2>
        <p className="metric">${revenueData?.total_revenue?.toLocaleString() || 0}</p>
        <p className="subtext">From {revenueData?.total_orders} completed orders</p>
      </div>

      {/* Recharts Pie Chart */}
      <div className="chart-container">
        <h2>Sales by Category</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default App