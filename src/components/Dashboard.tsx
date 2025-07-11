"use client"
import React, { useEffect, useState, ChangeEvent } from "react"
import CountUp from "react-countup"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Tooltip
} from "recharts"
import { supabase } from "@/lib/supabase"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

// --- TYPES ---
interface Sale {
  id: number
  date: string
  ref: string
  customer: string
  subtotal: number
  order_tax: number
  discount: number
  discount_type: string
  shipping: number
  grand_total: number
  paid: number
  due: number
  payment_status: string
  details: string
  created_by: string
  warehouse: string
}

interface Product {
  id: string
  name: string
  code: string
  category: string
  brand: string
  cost: number
  price: number
  current_stock: number
  unit_product: string
  unit_sale: string
  unit_purchase: string
  minimum_quantity: number
  stock_alert: number
  has_imei: boolean
  order_tax: number
  tax_method: string
  details: string
  type: string
  image_url: string
  created_at: string
  updated_at: string
}

interface WeeklySale {
  week_date: string
  sales_amount: number
  purchases_amount: number
}

interface DashboardData {
  totalPurchases: number
  totalSales: number
  salesReturn: number
  purchaseReturn: number
  recentSales: Sale[]
  topProducts: Product[]
  weeklySales: WeeklySale[]
}

const COLORS: string[] = ["#6EE7B7", "#93C5FD", "#FCD34D", "#FCA5A5", "#C4B5FD", "#FDBA74"]

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalPurchases: 0,
    totalSales: 0,
    salesReturn: 0,
    purchaseReturn: 0,
    recentSales: [],
    topProducts: [],
    weeklySales: []
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true)
    try {
      const { data: salesData } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false })
        .limit(10)

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .order("current_stock", { ascending: false })
        .limit(5)

      const today = new Date().toISOString().split("T")[0]
      const todaySales = salesData?.filter(sale => sale.date?.startsWith(today)) || []
      const totalSales = todaySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)

      const mockWeeklySales: WeeklySale[] = [
        { week_date: "2025-07-01", sales_amount: 400, purchases_amount: 150 },
        { week_date: "2025-07-02", sales_amount: 500, purchases_amount: 200 },
        { week_date: "2025-07-03", sales_amount: 350, purchases_amount: 120 },
        { week_date: "2025-07-04", sales_amount: 600, purchases_amount: 180 },
        { week_date: "2025-07-05", sales_amount: 450, purchases_amount: 160 },
        { week_date: "2025-07-06", sales_amount: 520, purchases_amount: 190 },
        { week_date: "2025-07-07", sales_amount: 480, purchases_amount: 170 }
      ]

      setData({
        totalPurchases: 1040,
        totalSales,
        salesReturn: 0,
        purchaseReturn: 0,
        recentSales: salesData || [],
        topProducts: productsData || [],
        weeklySales: mockWeeklySales
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value)
  }

  const chartData = data.weeklySales.map(item => ({
    name: new Date(item.week_date).toLocaleDateString("en-US", { weekday: "short" }),
    Sales: item.sales_amount,
    Purchases: item.purchases_amount
  }))

  const pieData = data.topProducts.map(product => ({
    name: product.name,
    value: product.current_stock
  }))

  const filteredSales = data.recentSales.filter(sale =>
    sale.customer?.toLowerCase().includes(search.toLowerCase()) ||
    sale.ref?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Greeting + metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
            <div>
              <div className="text-sm text-gray-500">Good Morning, William Castillo!</div>
              <div className="text-xs text-gray-400">Here's what happening with your store today!</div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="text-lg font-semibold">
                <CountUp end={data.totalPurchases} prefix="$ " decimals={2} duration={2} />
              </div>
              <div className="text-xs text-gray-500">Today's total Purchases</div>
              <div className="text-lg font-semibold">
                <CountUp end={data.totalSales} prefix="$ " decimals={2} duration={2} />
              </div>
              <div className="text-xs text-gray-500">Today's total Sales</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <div className="text-sm text-gray-500">Sales</div>
            <div className="text-xl font-semibold">
              <CountUp end={data.totalSales} prefix="$ " decimals={2} duration={2} />
            </div>
            <div className="text-sm text-gray-500">Sales Return</div>
            <div className="text-xl font-semibold">
              <CountUp end={data.salesReturn} prefix="$ " decimals={2} duration={2} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <div className="text-sm text-gray-500">Purchases</div>
            <div className="text-xl font-semibold">
              <CountUp end={data.totalPurchases} prefix="$ " decimals={2} duration={2} />
            </div>
            <div className="text-sm text-gray-500">Purchases Return</div>
            <div className="text-xl font-semibold">
              <CountUp end={data.purchaseReturn} prefix="$ " decimals={2} duration={2} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow col-span-2">
            <div className="font-semibold mb-4">This Week Sales & Purchases</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sales" fill="#3b82f6" radius={[6,6,0,0]} />
                <Bar dataKey="Purchases" fill="#34d399" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="font-semibold mb-4">Top Selling Products (2025)</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={50} fill="#8884d8" label>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="font-semibold mb-4">Top Clients (Jul, 2025)</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={50} fill="#10b981" label>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold">Recent Sales</div>
            <Input placeholder="Search by ref or customer" value={search} onChange={handleSearch} className="w-60" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead><TableHead>Customer</TableHead>
                <TableHead>Grand Total</TableHead><TableHead>Paid</TableHead>
                <TableHead>Due</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(loading ? Array(5).fill(null) : filteredSales).map((sale, idx) => (
                loading ?
                  <TableRow key={idx}><TableCell colSpan={6} className="py-6">
                    <div className="h-4 bg-gray-300 animate-pulse rounded w-1/2 mx-auto"></div>
                  </TableCell></TableRow>
                :
                  <TableRow key={sale.id}>
                    <TableCell>{sale.ref}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>${sale.grand_total?.toFixed(2)}</TableCell>
                    <TableCell>${sale.paid?.toFixed(2)}</TableCell>
                    <TableCell>${sale.due?.toFixed(2)}</TableCell>
                    <TableCell>{sale.payment_status}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
