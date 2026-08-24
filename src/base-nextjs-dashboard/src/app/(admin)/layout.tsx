"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { ToastProvider } from "@/context/ToastContext";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isLoading } = useAuth(true);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <ToastProvider>
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        {/* `min-w-0` is load-bearing: a flex item defaults to `min-width: auto`,
            which refuses to shrink below its content's min-content width — and
            that measurement passes straight through a table's `overflow-x-auto`
            wrapper. Without it a wide table makes the whole *page* scroll
            sideways (sliding the breadcrumb under the fixed sidebar) while the
            table itself never scrolls at all. Only breaks from `xl` up, where
            `xl:flex` is on, so it is easy to miss when testing narrow. */}
        <div
          className={`flex-1 min-w-0 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
