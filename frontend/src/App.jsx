import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function App() {
  const [revenueData, setRevenueData] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Added the top-products endpoint to our simultaneous fetch
        const [revenueRes, categoryRes, productsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/metrics/total-revenue'),
          fetch('http://127.0.0.1:8000/api/metrics/sales-by-category'),
          fetch('http://127.0.0.1:8000/api/metrics/top-products')
        ])

        const revenueJson = await revenueRes.json()
        const categoryJson = await categoryRes.json()
        const productsJson = await productsRes.json()

        setRevenueData(revenueJson)
        
        const formattedCategoryData = categoryJson.map(item => ({
          name: item.category,
          value: parseFloat(item.category_revenue)
        }))
        setCategoryData(formattedCategoryData)
        
        // Store the products data
        setTopProducts(productsJson)
        
        setLoading(false)

      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading VANAD Analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">VANAD Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time store performance and metrics</p>
        </header>

        {/* Top Grid: KPIs and Main Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KPI Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</h2>
            <p className="text-4xl font-extrabold text-emerald-600 mt-2">
              ${revenueData?.total_revenue?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Across <span className="font-semibold text-gray-600">{revenueData?.total_orders}</span> completed orders
            </p>
          </div>

          {/* Pie Chart Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Sales by Category</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section: Top Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Top Selling Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Product Name</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium text-right">Units Sold</th>
                  <th className="px-6 py-4 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-800 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{product.category}</td>
                    <td className="px-6 py-4 text-gray-800 text-right">{product.total_sold}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium text-right">
                      ${parseFloat(product.total_revenue).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App