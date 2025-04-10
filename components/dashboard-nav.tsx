"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  FileText,
  Search,
  ListChecks,
  MessageSquare,
  User,
  BarChart,
  Bell,
  Mail,
  Percent,
  DollarSign,
  Settings,
} from "lucide-react"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <BarChart className="mr-2 h-4 w-4" />,
  },
  {
    title: "Resume Optimizer",
    href: "/dashboard/resume",
    icon: <FileText className="mr-2 h-4 w-4" />,
  },
  {
    title: "Resume Score",
    href: "/dashboard/resume/score",
    icon: <Percent className="mr-2 h-4 w-4" />,
  },
  {
    title: "Job Search",
    href: "/dashboard/jobs",
    icon: <Search className="mr-2 h-4 w-4" />,
  },
  {
    title: "Job Alerts",
    href: "/dashboard/alerts",
    icon: <Bell className="mr-2 h-4 w-4" />,
  },
  {
    title: "Job Match",
    href: "/dashboard/match",
    icon: <Percent className="mr-2 h-4 w-4" />,
  },
  {
    title: "Application Tracker",
    href: "/dashboard/applications",
    icon: <ListChecks className="mr-2 h-4 w-4" />,
  },
  {
    title: "Follow-Up Generator",
    href: "/dashboard/follow-up",
    icon: <Mail className="mr-2 h-4 w-4" />,
  },
  {
    title: "AI Assistant",
    href: "/dashboard/assistant",
    icon: <MessageSquare className="mr-2 h-4 w-4" />,
  },
  {
    title: "Salary Negotiation",
    href: "/dashboard/salary",
    icon: <DollarSign className="mr-2 h-4 w-4" />,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: <User className="mr-2 h-4 w-4" />,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 py-4">
      {items.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
          )}
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  )
}
