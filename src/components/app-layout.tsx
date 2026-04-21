"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive, Book, LayoutDashboard, Library, PanelLeft, Settings, User as UserIcon, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUser } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Library"  },
  { href: "/discover",  icon: Library,         label: "Discover" },
  { href: "/clubs",     icon: Users,            label: "Clubs"    },
  { href: "/archive",   icon: Archive,          label: "Archive"  },
  { href: "/profile",   icon: UserIcon,         label: "Profile"  },
  { href: "/settings",  icon: Settings,         label: "Settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#F5F0E8',
        fontFamily: "'Playfair Display', serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <div style={{ color: '#8A8578', fontStyle: 'italic', fontSize: 14 }}>
            Loading your sanctuary...
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Sidebar shell ── */
        [data-sidebar="sidebar"] {
          background: #1C2B1E !important;
          border-right: none !important;
        }

        /* ── Logo area ── */
        .sipha-logo-wrap {
          padding: 28px 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 8px;
        }
        .sipha-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em;
          line-height: 1;
        }
        .sipha-logo-sub {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-top: 4px;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Nav items ── */
        [data-sidebar="menu-button"] {
          color: rgba(255,255,255,0.45) !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 13px !important;
          font-weight: 400 !important;
          letter-spacing: 0.02em !important;
          border-radius: 0 !important;
          padding: 10px 20px !important;
          border-left: 2px solid transparent !important;
          transition: all 0.15s ease !important;
          height: auto !important;
        }
        [data-sidebar="menu-button"]:hover {
          background: rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.85) !important;
        }
        [data-sidebar="menu-button"][data-active="true"] {
          background: rgba(255,255,255,0.07) !important;
          color: #fff !important;
          border-left-color: #A8C5A0 !important;
        }
        [data-sidebar="menu-button"] svg {
          opacity: 0.6;
          width: 14px !important;
          height: 14px !important;
        }
        [data-sidebar="menu-button"][data-active="true"] svg {
          opacity: 1;
        }

        /* ── Page header ── */
        .sipha-header {
          background: #F5F0E8 !important;
          border-bottom: 1px solid #D8D0C0 !important;
        }
        .sipha-header-title {
          font-family: 'Playfair Display', serif !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #1A1A18 !important;
          letter-spacing: 0.01em !important;
        }

        /* ── Main content area ── */
        [data-sidebar="inset"], .sipha-inset {
          background: #F5F0E8 !important;
        }
      `}</style>

      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="sipha-logo-wrap">
              <div className="sipha-logo-name">Sipha</div>
              <div className="sipha-logo-sub">The Digital Curator</div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="sipha-inset">
          <header className="sipha-header flex h-14 items-center gap-4 border-b px-4 md:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <div className="flex-1">
              <h1 className="sipha-header-title">
                {navItems.find((item) => pathname.startsWith(item.href))?.label || "Sipha"}
              </h1>
            </div>
            <UserMenu />
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

function UserMenu() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9" style={{ border: '1.5px solid #D8D0C0' }}>
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
            <AvatarFallback style={{ background: '#2A3D2D', color: '#fff', fontFamily: "'Playfair Display', serif" }}>
              {user.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
        style={{ background: '#F5F0E8', border: '1px solid #D8D0C0' }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 600 }}>
              {user.displayName || "Reader"}
            </p>
            <p style={{ fontSize: 11, color: '#8A8578' }}>
              {user.email || user.uid}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: '#D8D0C0' }} />
        <Link href="/dashboard">
          <DropdownMenuItem>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/profile">
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator style={{ background: '#D8D0C0' }} />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}