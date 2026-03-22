import { useState, useEffect } from 'react'
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts'

function App() {
  const [revenueData, setRevenueData] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [forecastData, setForecastData] = useState([])
  const [loading, setLoading] = useState(true)

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  useEffect(() => {
    const fetchData = async () => {
      try {
        // We now fetch all 5 endpoints, including the ML prediction
        const [revenueRes, categoryRes, productsRes, ordersRes, forecastRes] = await Promise.all([
          fetch('http://localhost:8000/api/metrics/total-revenue'),
          fetch('http://localhost:8000/api/metrics/sales-by-category'),
          fetch('http://localhost:8000/api/metrics/top-products'),
          fetch('http://localhost:8000/api/orders/recent'),
          fetch('http://localhost:8000/api/predict')
        ])

        const revenueJson = await revenueRes.json()
        const categoryJson = await categoryRes.json()
        const productsJson = await productsRes.json()
        const ordersJson = await ordersRes.json()
        const forecastJson = await forecastRes.json()

        setRevenueData(revenueJson)
        
        const formattedCategoryData = categoryJson.map(item => ({
          name: item.category,
          value: parseFloat(item.category_revenue)
        }))
        setCategoryData(formattedCategoryData)
        
        setTopProducts(productsJson)
        setRecentOrders(ordersJson)

        // Format the forecast data specifically for our Recharts AreaChart
        const formattedForecast = forecastJson.map(item => ({
          name: `Step ${item.future_step}`,
          Projected: item.projected_revenue
        }))
        setForecastData(formattedForecast)
        
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
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">VANAD Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time store performance and metrics</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
            AI Forecasting Active
          </span>
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

        {/* Middle Section: ML Forecast Trend */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Revenue Projection (Next 7 Steps)</h2>
              <p className="text-sm text-gray-500 mt-1">Predicted via Scikit-Learn Linear Regression model</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Projected Revenue']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Projected" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProjected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Grid: Products Table and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Top Selling Products Table (Spans 2 columns) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2 flex flex-col">
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

          {/* Recent Transactions Feed (Spans 1 column) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <ul className="divide-y divide-gray-100">
                {recentOrders.map((order, index) => (
                  <li key={index} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.first_name} {order.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Order #{order.order_id} • {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ${parseFloat(order.total_amount).toLocaleString()}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 mt-1 uppercase tracking-wide">
                        {order.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default App