"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, DollarSign, Users, FileText, Clock, CheckCircle, XCircle, Plus, Eye, Download } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  completedBookings: number
  totalRevenue: number
  monthlyRevenue: number
  totalClients: number
}

interface Booking {
  id: string
  title: string
  client: {
    username: string
    avatar?: string
  }
  startTime: string
  endTime: string
  status: string
  price: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  client: {
    username: string
  }
  amount: number
  status: string
  dueDate: string
  createdAt: string
}

export default function ProDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalClients: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "PRO") {
      router.push("/")
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, invoicesRes] = await Promise.all([
        fetch("/api/pro/stats"),
        fetch("/api/pro/bookings?limit=5"),
        fetch("/api/pro/invoices?limit=5"),
      ])

      const [statsData, bookingsData, invoicesData] = await Promise.all([
        statsRes.json(),
        bookingsRes.json(),
        invoicesRes.json(),
      ])

      setStats(statsData)
      setRecentBookings(bookingsData.bookings || [])
      setRecentInvoices(invoicesData.invoices || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500"
      case "confirmed":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4" aria-hidden="true" />
      case "confirmed":
        return <CheckCircle className="w-4 h-4" aria-hidden="true" />
      case "completed":
        return <CheckCircle className="w-4 h-4" aria-hidden="true" />
      case "cancelled":
        return <XCircle className="w-4 h-4" aria-hidden="true" />
      default:
        return <Clock className="w-4 h-4" aria-hidden="true" />
    }
  }

  // ACCESSIBILITY: Get status description for screen readers
  const getStatusDescription = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Waiting for confirmation"
      case "confirmed":
        return "Confirmed and scheduled"
      case "completed":
        return "Successfully completed"
      case "cancelled":
        return "Cancelled"
      default:
        return "Status unknown"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"
          // ACCESSIBILITY: Loading indicator
          role="status"
          aria-label="Loading dashboard data, please wait..."
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pro Dashboard</h1>
            <p className="text-gray-400">Welcome back, {session?.user?.username}</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/pro/bookings/new">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                // ACCESSIBILITY: Clear button purpose
                aria-label="Create a new booking"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                New Booking
              </Button>
            </Link>
            <Link href="/pro/invoices/new">
              <Button 
                variant="outline" 
                className="border-gray-600 text-white bg-transparent"
                // ACCESSIBILITY: Clear button purpose
                aria-label="Create a new invoice"
              >
                <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Cards */}
        <section 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          // ACCESSIBILITY: Stats section
          role="region"
          aria-label="Dashboard statistics"
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-blue-400" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold text-white"
                aria-label={`${stats.totalBookings} total bookings`}
              >
                {stats.totalBookings}
              </div>
              <p 
                className="text-xs text-gray-400"
                aria-label={`${stats.pendingBookings} bookings pending approval`}
              >
                {stats.pendingBookings} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold text-white"
                aria-label={`${stats.monthlyRevenue} euros monthly revenue`}
              >
                €{stats.monthlyRevenue}
              </div>
              <p 
                className="text-xs text-gray-400"
                aria-label={`${stats.totalRevenue} euros total revenue`}
              >
                €{stats.totalRevenue} total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Clients</CardTitle>
              <Users className="h-4 w-4 text-purple-400" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold text-white"
                aria-label={`${stats.totalClients} active clients`}
              >
                {stats.totalClients}
              </div>
              <p className="text-xs text-gray-400">Active clients</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold text-white"
                aria-label={`${stats.completedBookings} bookings completed this month`}
              >
                {stats.completedBookings}
              </div>
              <p className="text-xs text-gray-400">This month</p>
            </CardContent>
          </Card>
        </section>

        {/* Main Content */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList 
            className="bg-gray-900 border-gray-800"
            // ACCESSIBILITY: Proper tab list
            role="tablist"
            aria-label="Dashboard sections"
          >
            <TabsTrigger 
              value="bookings" 
              className="data-[state=active]:bg-gray-800"
              // ACCESSIBILITY: Tab accessibility
              role="tab"
              aria-controls="bookings-panel"
            >
              Recent Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="data-[state=active]:bg-gray-800"
              // ACCESSIBILITY: Tab accessibility
              role="tab"
              aria-controls="invoices-panel"
            >
              Recent Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="bookings"
            // ACCESSIBILITY: Tab panel
            role="tabpanel"
            id="bookings-panel"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Recent Bookings</CardTitle>
                    <CardDescription className="text-gray-400">
                      Your latest booking requests and appointments
                    </CardDescription>
                  </div>
                  <Link href="/pro/bookings">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-600 text-white bg-transparent"
                      aria-label="View all bookings"
                    >
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                      // ACCESSIBILITY: Booking item role
                      role="article"
                      aria-label={`Booking: ${booking.title} with ${booking.client.username} for ${booking.price} euros, status: ${getStatusDescription(booking.status)}`}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar 
                          className="w-10 h-10"
                          role="img"
                          aria-label={`${booking.client.username}'s profile picture`}
                        >
                          <AvatarImage 
                            src={booking.client.avatar || "/placeholder.svg"} 
                            alt={`Profile picture of ${booking.client.username}`}
                          />
                          <AvatarFallback>{booking.client.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-white">{booking.title}</h4>
                          <p className="text-sm text-gray-400">
                            with {booking.client.username} • <time dateTime={booking.startTime}>{new Date(booking.startTime).toLocaleDateString()}</time>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span 
                          className="text-green-400 font-medium"
                          aria-label={`Price: ${booking.price} euros`}
                        >
                          €{booking.price}
                        </span>
                        <Badge 
                          className={`${getStatusColor(booking.status)} text-white`}
                          // ACCESSIBILITY: Status badge with description
                          aria-label={`Booking status: ${getStatusDescription(booking.status)}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(booking.status)}
                            <span className="capitalize">{booking.status}</span>
                          </div>
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-600 text-white bg-transparent"
                          aria-label={`View details for booking ${booking.title}`}
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent 
            value="invoices"
            // ACCESSIBILITY: Tab panel
            role="tabpanel"
            id="invoices-panel"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Recent Invoices</CardTitle>
                    <CardDescription className="text-gray-400">Your latest invoices and payments</CardDescription>
                  </div>
                  <Link href="/pro/invoices">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-600 text-white bg-transparent"
                      aria-label="View all invoices"
                    >
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                      // ACCESSIBILITY: Invoice item role
                      role="article"
                      aria-label={`Invoice ${invoice.invoiceNumber} for ${invoice.client.username}, amount: ${invoice.amount} euros, status: ${invoice.status}`}
                    >
                      <div>
                        <h4 className="font-medium text-white">#{invoice.invoiceNumber}</h4>
                        <p className="text-sm text-gray-400">
                          {invoice.client.username} • Due <time dateTime={invoice.dueDate}>{new Date(invoice.dueDate).toLocaleDateString()}</time>
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span 
                          className="text-green-400 font-medium"
                          aria-label={`Amount: ${invoice.amount} euros`}
                        >
                          €{invoice.amount}
                        </span>
                        <Badge 
                          className={`${invoice.status === "paid" ? "bg-green-500" : "bg-yellow-500"} text-white`}
                          // ACCESSIBILITY: Payment status for screen readers
                          aria-label={`Payment status: ${invoice.status === "paid" ? "Paid" : "Pending payment"}`}
                        >
                          {invoice.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-600 text-white bg-transparent"
                          aria-label={`Download invoice ${invoice.invoiceNumber}`}
                        >
                          <Download className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
