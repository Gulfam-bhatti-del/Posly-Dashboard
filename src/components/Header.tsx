"use client";

import { Plus, Move, Globe, User, LogOut, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function ResponsiveHeader() {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully signed out!");
    } catch (error: any) {
      toast.error(error.message);
    }
    redirect("/");
  };

  const getUserInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  if (loading) {
    return (
      <header className="h-16 sm:h-20 bg-white shadow-md px-3 sm:px-4 lg:px-6 flex items-center justify-between border-b">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 sm:w-16 sm:h-10 bg-gray-200 animate-pulse rounded-md" />
          <div className="hidden sm:block w-20 sm:w-24 h-10 bg-gray-200 animate-pulse rounded-md" />
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:block w-16 h-10 bg-gray-200 animate-pulse rounded-md" />
          <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 sm:h-20 bg-white shadow-md px-3 sm:px-4 lg:px-6 flex items-center justify-between border-b">
      {/* Left Side: Sidebar Trigger + Add New Button */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <SidebarTrigger className="p-2 sm:py-[21px] sm:px-[21px] cursor-pointer rounded-md text-black bg-blue-100 hover:shadow-sm transition-shadow" />

        {/* Add New Button - Responsive */}
        <button className="flex items-center space-x-1 cursor-pointer bg-blue-100 hover:shadow-sm text-sm sm:text-lg text-gray-900 font-medium px-2 sm:px-4 py-2 rounded-md transition-shadow">
          <Plus size={14} className="sm:size-4" />
          <span className="hidden xs:inline sm:inline">Add new</span>
          <span className="xs:hidden sm:hidden">Add</span>
        </button>
      </div>

      {/* Right Side: POS + Icons + Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
        {/* POS Button - Hidden on very small screens */}
        <Link href="/pos">
        <button className="hidden sm:block px-4 lg:px-10 py-2 lg:py-3.5 text-xs sm:text-sm cursor-pointer font-bold text-blue-600 border border-blue-500 rounded-md hover:text-gray-900 hover:bg-blue-400 transition-colors">
          POS
        </button>
        </Link>

        {/* Action Icons - Hidden on mobile, shown on tablet+ */}
        <div className="hidden md:flex items-center space-x-3">
          <Move
            size={18}
            className="text-gray-600 hover:text-black cursor-pointer transition-colors"
          />
          <Globe
            size={18}
            className="text-gray-600 hover:text-black cursor-pointer transition-colors"
          />
        </div>

        {/* Mobile Actions Dropdown - Shown only on mobile */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu size={18} className="text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <Move className="mr-2 h-4 w-4" />
                <span>Move</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Globe className="mr-2 h-4 w-4" />
                <span>Global</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer sm:hidden">
                <Link href="/pos">
                  <span className="text-blue-600 font-bold">POS</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Avatar */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0"
              >
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                  <AvatarImage
                    src={
                      user.user_metadata?.avatar_url ||
                      user.user_metadata?.picture
                    }
                    alt={user.email || "User"}
                  />
                  <AvatarFallback className="bg-blue-300 text-white text-xs sm:text-sm">
                    {user.email ? (
                      getUserInitials(user.email)
                    ) : (
                      <User size={16} />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {user.user_metadata?.full_name ||
                      getUserDisplayName(user.email || "")}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
            <AvatarFallback className="bg-blue-300">
              <User className="text-white" size={16} />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}
