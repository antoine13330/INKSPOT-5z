"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Search,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AdminStats {
  totalUsers: number
  totalPros: number
  totalClients: number
  pendingUsers: number
  totalBookings: number
  totalRevenue: number
  monthlyRevenue: number
  reportedContent: number
}

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  verified: boolean
  createdAt: string
  avatar?: string
  businessName?: string
}

interface ReportedContent {
  id: string
  type: string
  content: string
  reporter: {
    username: string
  }
  reported: {
    username: string
  }
  reason: string
  status: string
  createdAt: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPros: 0,
    totalClients: 0,
    pendingUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    reportedContent: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/")
      return
    }

    fetchAdminData()
  }, [session, status, router])

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/reports"),
      ])

      const [statsData, usersData, reportsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        reportsRes.json(),
      ])

      setStats(statsData)
      setUsers(usersData.users || [])
      setReportedContent(reportsData.reports || [])
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: "suspend" | "activate" | "verify") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        fetchAdminData() // Refresh data
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleReportAction = async (reportId: string, action: "resolve" | "dismiss") => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        fetchAdminData() // Refresh data
      }
    } catch (error) {
      console.error("Error updating report:", error)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500"
      case "suspended":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500"
      case "PRO":
        return "bg-blue-500"
      case "CLIENT":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Platform management and moderation</p>
          </div>
          <Badge className="bg-purple-600 text-white">
            <Shield className="w-4 h-4 mr-2" />
            Administrator
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-gray-400">
                {stats.totalPros} pros, {stats.totalClients} clients
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Platform Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">€{stats.totalRevenue}</div>
              <p className="text-xs text-gray-400">€{stats.monthlyRevenue} this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
              <p className="text-xs text-gray-400">Platform activity</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Reviews</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.reportedContent}</div>
              <p className="text-xs text-gray-400">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-800">
              User Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gray-800">
              Reported Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">User Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage user accounts, roles, and permissions
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-white">{user.username}</h4>
                            {user.verified && <CheckCircle className="w-4 h-4 text-blue-400" />}
                          </div>
                          <p className="text-sm text-gray-400">
                            {user.email} • {user.businessName && `${user.businessName} • `}
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getRoleColor(user.role)} text-white`}>{user.role}</Badge>
                        <Badge className={`${getStatusColor(user.status)} text-white`}>{user.status}</Badge>
                        <div className="flex space-x-1">
                          {user.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 bg-transparent hover:bg-red-600 hover:text-white"
                              onClick={() => handleUserAction(user.id, "suspend")}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-600 text-green-400 bg-transparent hover:bg-green-600 hover:text-white"
                              onClick={() => handleUserAction(user.id, "activate")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {!user.verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-600 text-blue-400 bg-transparent hover:bg-blue-600 hover:text-white"
                              onClick={() => handleUserAction(user.id, "verify")}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="border-gray-600 text-white bg-transparent">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Reported Content</CardTitle>
                <CardDescription className="text-gray-400">
                  Review and moderate reported posts, messages, and users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportedContent.map((report) => (
                    <div key={report.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className="bg-red-600 text-white">{report.type}</Badge>
                            <span className="text-sm text-gray-400">Reported by {report.reporter.username}</span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Against {report.reported.username} • {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={`${report.status === "pending" ? "bg-yellow-500" : "bg-gray-500"} text-white`}
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-white text-sm mb-2">Reason: {report.reason}</p>
                        <div className="bg-gray-700 p-3 rounded text-sm text-gray-300">{report.content}</div>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleReportAction(report.id, "resolve")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-white bg-transparent"
                            onClick={() => handleReportAction(report.id, "dismiss")}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Dismiss
                          </Button>
                        </div>
                      )}
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
