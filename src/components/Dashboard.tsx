"use client"

import type React from "react"
import { useEffect, useState, type ChangeEvent } from "react"
import CountUp from "react-countup"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

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

interface Purchase {
  id: string // uuid
  date: string
  ref: string
  supplier: string
  warehouse: string
  products: any[] // jsonb
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
  created_at: string
  updated_at: string
}

interface Customer {
  id: number // bigserial
  code: number
  full_name: string
  phone: string
  total_sale_due: number
  total_sell_return_due: number
  status: string
  image_path: string
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
  topClients: Customer[] // Added for top clients
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
    weeklySales: [],
    topClients: [],
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true)
    try {
      // Fetch Recent Sales
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false })
        .limit(10)
      if (salesError) throw salesError

      // Fetch Products (for Top Products)
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("current_stock", { ascending: false }) // Assuming top products by stock
        .limit(5)
      if (productsError) throw productsError

      // Fetch Purchases for totalPurchases
      const { data: allPurchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("grand_total, date")
      if (purchasesError) throw purchasesError

      // Fetch Sales Returns for salesReturn
      const { data: salesReturnsData, error: salesReturnsError } = await supabase
        .from("sales_returns")
        .select("grand_total")
      if (salesReturnsError) throw salesReturnsError

      // Fetch Purchase Returns for purchaseReturn
      const { data: purchaseReturnsData, error: purchaseReturnsError } = await supabase
        .from("purchase_returns")
        .select("grand_total")
      if (purchaseReturnsError) throw purchaseReturnsError

      // Fetch Customers for Top Clients
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, code, full_name, phone, total_sale_due, total_sell_return_due, status, image_path")
        .limit(5) // Limiting for display, actual top clients would need aggregation
      if (customersError) throw customersError

      // Calculate Today's Sales
      const today = new Date().toISOString().split("T")[0]
      const todaySales = salesData?.filter((sale) => sale.date?.startsWith(today)) || []
      const totalSalesToday = todaySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)

      // Calculate Total Purchases
      const totalPurchasesAmount =
        allPurchasesData?.reduce((sum, purchase) => sum + (purchase.grand_total || 0), 0) || 0

      // Calculate Sales Return
      const totalSalesReturn = salesReturnsData?.reduce((sum, sr) => sum + (sr.grand_total || 0), 0) || 0

      // Calculate Purchase Return
      const totalPurchaseReturn = purchaseReturnsData?.reduce((sum, pr) => sum + (pr.grand_total || 0), 0) || 0

      // --- Fetch and Aggregate Weekly Sales Data from Supabase ---
      const { data: allSalesForWeeklyChart, error: weeklySalesError } = await supabase
        .from("sales")
        .select("date, grand_total")
        .order("date", { ascending: false }) // Order by date to get recent sales
        .limit(100) // Fetch enough data to cover the last 7 days
      if (weeklySalesError) throw weeklySalesError

      const { data: allPurchasesForWeeklyChart, error: weeklyPurchasesError } = await supabase
        .from("purchases")
        .select("date, grand_total")
        .order("date", { ascending: false })
        .limit(100)
      if (weeklyPurchasesError) throw weeklyPurchasesError

      const salesByDay: { [key: string]: number } = {}
      allSalesForWeeklyChart?.forEach((sale) => {
        const date = sale.date.split("T")[0] // Get YYYY-MM-DD
        salesByDay[date] = (salesByDay[date] || 0) + (sale.grand_total || 0)
      })

      const purchasesByDay: { [key: string]: number } = {}
      allPurchasesForWeeklyChart?.forEach((purchase) => {
        const date = purchase.date.split("T")[0] // Get YYYY-MM-DD
        purchasesByDay[date] = (purchasesByDay[date] || 0) + (purchase.grand_total || 0)
      })

      const weeklySalesData: WeeklySale[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateString = d.toISOString().split("T")[0]
        weeklySalesData.push({
          week_date: dateString,
          sales_amount: salesByDay[dateString] || 0,
          purchases_amount: purchasesByDay[dateString] || 0,
        })
      }
      // --- End Weekly Sales Data Fetching ---

      setData({
        totalPurchases: totalPurchasesAmount,
        totalSales: totalSalesToday,
        salesReturn: totalSalesReturn,
        purchaseReturn: totalPurchaseReturn,
        recentSales: salesData || [],
        topProducts: productsData || [],
        weeklySales: weeklySalesData, // Using aggregated data
        topClients: (customersData || []).map((c) => ({
          id: c.id,
          code: c.code ?? 0,
          full_name: c.full_name ?? "",
          phone: c.phone ?? "",
          total_sale_due: c.total_sale_due ?? 0,
          total_sell_return_due: c.total_sell_return_due ?? 0,
          status: c.status ?? "",
          image_path: c.image_path ?? "",
        })), // Ensuring all required Customer fields are present
      })
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err.message)
      // Optionally show a toast error here
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value)
  }

  const chartData = data.weeklySales.map((item) => ({
    name: new Date(item.week_date).toLocaleDateString("en-US", { weekday: "short" }),
    Sales: item.sales_amount,
    Purchases: item.purchases_amount,
  }))

  const pieDataProducts = data.topProducts.map((product) => ({
    name: product.name,
    value: product.current_stock,
  }))

  const pieDataClients = data.topClients.map((client) => ({
    name: client.full_name,
    value: 1, // Placeholder value, ideally this would be total sales for the client
  }))

  const filteredSales = data.recentSales.filter(
    (sale) =>
      sale.customer?.toLowerCase().includes(search.toLowerCase()) ||
      sale.ref?.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

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
                <CountUp end={data.totalSales} prefix="RS " decimals={2} duration={2} />
              </div>
              <div className="text-xs text-gray-500">Today's total Sales</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <div className="text-sm text-gray-500">Sales</div>
            <div className="text-xl font-semibold">
              <CountUp end={data.totalSales} prefix="RS " decimals={2} duration={2} />
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
          <div className="bg-white p-6 rounded-lg shadow col-span-1 lg:col-span-2">
            <div className="font-semibold mb-4">This Week Sales & Purchases</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sales" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Purchases" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-6 col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="font-semibold mb-4">Top Selling Products (2025)</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieDataProducts} dataKey="value" outerRadius={50} fill="#8884d8" label>
                    {pieDataProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="font-semibold mb-4">Top Clients (Jul, 2025)</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieDataClients} dataKey="value" outerRadius={50} fill="#10b981" label>
                    {pieDataClients.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
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
                <TableHead>Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-gray-500">
                    No recent sales found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.ref}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>${sale.grand_total?.toFixed(2)}</TableCell>
                    <TableCell>${sale.paid?.toFixed(2)}</TableCell>
                    <TableCell>${sale.due?.toFixed(2)}</TableCell>
                    <TableCell>{sale.payment_status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
