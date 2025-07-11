"use client"

import type * as React from "react"
import { ChevronRight, LucideLayoutDashboard, ShoppingBagIcon, ShoppingCart } from "lucide-react"
import {
  FaUser,
  FaExchangeAlt,
  FaClipboardList,
  FaShoppingCart,
  FaCashRegister,
  FaCog,
  FaFileAlt,
} from "react-icons/fa"
import { MdOutlineManageAccounts } from "react-icons/md"
import { BsBoxSeam, BsPeople } from "react-icons/bs"
import { HiOutlineAdjustments } from "react-icons/hi"
import Image from "next/image"
import Link from "next/link"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const menuItems = [
  { icon: <LucideLayoutDashboard size={18} />, label: "Dashboard", href: "/dashboard" },
  {
    icon: <MdOutlineManageAccounts size={18} />,
    label: "Users Management",
    submenu: [
      { label: "Users", href: "/users-management/users" },
      { label: "Roles", href: "/users-management/roles" },
    ],
  },
  {
    icon: <BsPeople size={18} />,
    label: "People",
    submenu: [
      { label: "Customers", href: "/people/customers" },
      { label: "Suppliers", href: "/people/suppliers" },
    ],
  },
  {
    icon: <BsBoxSeam size={18} />,
    label: "Products",
    submenu: [
      { label: "All Products", href: "/products/all-products" },
      { label: "Create product", href: "/products/create-product" },
      { label: "Print Labels", href: "/products/print-labels" },
      { label: "Category", href: "/products/category" },
      { label: "Unit", href: "/products/unit" },
      { label: "Brand", href: "/products/brand" },
      { label: "Warehouse", href: "/products/warehouse" },
    ],
  },
  {
    icon: <HiOutlineAdjustments size={18} />,
    label: "Adjustment",
    submenu: [
      { label: "All Adjustments", href: "/adjustment/all-adjustments" },
      { label: "Create Adjustment", href: "/adjustment/create-adjustment" },
    ],
  },
  {
    icon: <FaExchangeAlt size={18} />,
    label: "Transfer",
    submenu: [
      { label: "All Transfers", href: "/transfer/all-transfers" },
      { label: "Create Transfer", href: "/transfer/create-transfer" },
    ],
  },
  {
    icon: <FaClipboardList size={18} />,
    label: "Quotations",
    submenu: [
      { label: "All Quotations", href: "/quotations/all-quotations" },
      { label: "Add Quotation", href: "/quotations/add-quotation" },
    ],
  },
  {
    icon: <FaShoppingCart size={18} />,
    label: "Purchases",
    submenu: [
      { label: "All Purchases", href: "/purchases/all-purchases" },
      { label: "Create Purchase", href: "/purchases/create-purchase" },
    ],
  },
  {
    icon: <FaCashRegister size={18} />,
    label: "Sales",
    submenu: [
      { label: "All Sales", href: "/sales/all-sales" },
      { label: "Create Sale", href: "/sales/create-sale" },
    ],
  },
  {
    icon: <FaUser size={18} />,
    label: "Accounting",
    submenu: [
      { label: "Account", href: "/accounting/account" },
      { label: "Deposit", href: "/accounting/deposit" },
      { label: "Expense", href: "/accounting/expense" },
      { label: "Expense category", href: "/accounting/expense-category" },
      { label: "Deposit category", href: "/accounting/deposit-category" },
      { label: "Payment methods", href: "/accounting/payment-methods" },
    ],
  },
  {
    icon: <FaCog size={18} />,
    label: "Settings",
    submenu: [
      { label: "System Settings", href: "/settings/system-settings" },
      { label: "Pos Receipt Settings", href: "/settings/pos-receipt-settings" },
      { label: "SMS Settings", href: "/settings/sms-settings" },
      { label: "SMS templates", href: "/settings/sms-templates" },
      { label: "Emails templates", href: "/settings/emails-templates" },
      { label: "Currency", href: "/settings/currency" },
      { label: "Backup", href: "/settings/backup" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="bg-[#273043] border-r-0" {...props}>
      <SidebarHeader className="pb-4 bg-[#273043]">
        <div className="flex items-center px-2">
          <Link href="/">
          <Image
            src="https://posly.getstocky.com/images/logo-default.svg"
            alt="Posly Logo"
            width={100}
            height={40}
            className="h-10 w-auto"
            />
            </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#273043]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  {item.submenu ? (
                    <Collapsible className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full h-12 bg-[#273043] hover:bg-[#364152] hover:text-blue-400 text-white">
                          <span className="mr-3 opacity-80">{item.icon}</span>
                          <span className="flex-1 text-[15px]">{item.label}</span>
                          <ChevronRight className="ml-auto h-4 w-4 opacity-60 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="border-l-0 ml-6 pl-0">
                          {item.submenu.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.label}>
                              <SidebarMenuSubButton
                                asChild
                                className="hover:bg-[#364152] w-48 h-12 mr-24 text-white text-[15px] hover:text-blue-400 "
                              >
                                <Link href={subItem.href}>
                                  <span>• {subItem.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      className="bg-[#273043] hover:bg-[#364152] hover:text-blue-400 text-white"
                    >
                      <Link href={item.href || "#"}>
                        <span className="mr-3 opacity-80">{item.icon}</span>
                        <span className="text-[15px]">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}