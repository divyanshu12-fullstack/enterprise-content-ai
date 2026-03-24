"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  History, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Linkedin,
  Twitter,
  ChevronRight,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Mock previous generations
const mockGenerations = [
  {
    id: "1",
    topic: "The Future of AI in Enterprise Software",
    audience: "C-Level Executives",
    createdAt: "2026-03-24T10:30:00Z",
    duration: 11,
    status: "APPROVED",
    linkedin_preview: "Excited to share insights on the transformative power of AI in enterprise...",
    twitter_preview: "AI is reshaping enterprise software. Here's what you need to know...",
  },
  {
    id: "2",
    topic: "Building Remote-First Company Culture",
    audience: "Professionals",
    createdAt: "2026-03-23T15:45:00Z",
    duration: 14,
    status: "APPROVED",
    linkedin_preview: "Remote work isn't just a trend - it's the future of how we build teams...",
    twitter_preview: "Remote-first culture = better outcomes. Thread on what we learned...",
  },
  {
    id: "3",
    topic: "Investment Opportunities in Green Tech",
    audience: "General Audience",
    createdAt: "2026-03-23T09:15:00Z",
    duration: 13,
    status: "REJECTED",
    linkedin_preview: "Green technology offers promising investment opportunities for...",
    twitter_preview: "Green tech investment is booming. Here's our analysis...",
    rejection_reason: "Contains prohibited term: 'investment advice'"
  },
  {
    id: "4",
    topic: "Data Privacy Best Practices for 2026",
    audience: "Developers & Engineers",
    createdAt: "2026-03-22T14:20:00Z",
    duration: 10,
    status: "APPROVED",
    linkedin_preview: "Data privacy continues to evolve. Here are the best practices every...",
    twitter_preview: "Privacy-first development in 2026. Key practices to implement...",
  },
  {
    id: "5",
    topic: "Customer Success Strategies That Scale",
    audience: "Marketers",
    createdAt: "2026-03-22T11:00:00Z",
    duration: 12,
    status: "APPROVED",
    linkedin_preview: "Customer success is the new growth engine. Here's how to scale it...",
    twitter_preview: "Scaling customer success? Here's what actually works...",
  },
]

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [generations] = useState(mockGenerations)

  const filteredGenerations = generations.filter((gen) => {
    const matchesSearch = gen.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gen.audience.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || gen.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handleDelete = (id: string) => {
    toast.success("Generation deleted")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pl-14 md:h-16 md:flex-nowrap md:px-6 md:py-0 md:pl-6">
          <div>
            <h1 className="text-lg font-semibold md:text-xl">Previous Generations</h1>
            <p className="text-sm text-muted-foreground">View and manage your content history</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/app">
              New Generation
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-4 py-5 md:p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by topic or audience..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-37.5">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{generations.length}</p>
                <p className="text-sm text-muted-foreground">Total Generations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {generations.filter((g) => g.status === "APPROVED").length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {generations.filter((g) => g.status === "REJECTED").length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generations List */}
        <div className="space-y-4">
          {filteredGenerations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">No generations found</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start generating content to see your history here"}
                </p>
                <Button asChild>
                  <Link href="/app">Create Your First Generation</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredGenerations.map((gen) => (
              <Card key={gen.id} className="transition-all hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-3 flex items-start gap-3">
                        <Badge
                          className={cn(
                            "shrink-0",
                            gen.status === "APPROVED"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          )}
                          variant="outline"
                        >
                          {gen.status === "APPROVED" ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {gen.status}
                        </Badge>
                        <h3 className="font-semibold leading-tight">{gen.topic}</h3>
                      </div>

                      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(gen.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {gen.duration}s
                        </span>
                        <Badge variant="secondary">{gen.audience}</Badge>
                      </div>

                      {/* Previews */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-secondary/30 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Linkedin className="h-3.5 w-3.5" />
                            LinkedIn Preview
                          </div>
                          <p className="text-sm line-clamp-2">{gen.linkedin_preview}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/30 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Twitter className="h-3.5 w-3.5" />
                            Twitter Preview
                          </div>
                          <p className="text-sm line-clamp-2">{gen.twitter_preview}</p>
                        </div>
                      </div>

                      {gen.status === "REJECTED" && gen.rejection_reason && (
                        <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                          <p className="text-sm text-destructive">
                            <strong>Rejection reason:</strong> {gen.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:flex-col">
                      <Button variant="outline" size="sm" asChild className="flex-1 lg:w-full">
                        <Link href={`/app/approval?id=${gen.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopy(gen.linkedin_preview)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy LinkedIn
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopy(gen.twitter_preview)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Twitter
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(gen.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
