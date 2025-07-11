// import type React from "react";
// import type { Metadata } from "next";
// import "./globals.css";
// import Footer from "@/components/Footer";
// import Header from "@/components/Header";
// import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/Sidebar";

// export const metadata: Metadata = {
//   title: "Posly Dashboard",
//   description: "Inventory Management System",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" foxified="">
//       <body>
//         <SidebarProvider>
//           <AppSidebar />
//           <SidebarInset>
//             <div className="flex flex-col min-h-screen">
//               <Header />
//               <main className="flex-1 p-4">
//                 {children}{" "}
                
//               </main>
//               <div className="mt-8">
//                 <Footer />
//               </div>
//             </div>
//           </SidebarInset>
//         </SidebarProvider>
//       </body>
//     </html>
//   );
// }


import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Sidebar"
import { NavigationProgress } from "@/components/navigation-progress"
import { PageTransition } from "@/components/page-transition"

export const metadata: Metadata = {
  title: "Posly Dashboard",
  description: "Inventory Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" foxified="">
      <body>
        <NavigationProgress />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-4">
                <PageTransition>{children}</PageTransition>
              </main>
              <div className="mt-8">
                <Footer />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}
