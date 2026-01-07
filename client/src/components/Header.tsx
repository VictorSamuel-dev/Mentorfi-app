import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MessageSquare, Users, Bell, Menu, LogOut, User, Settings, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { logout } from "@/lib/api";

interface HeaderProps {
  isAuthenticated?: boolean;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
    email?: string | null;
  } | null;
  notificationCount?: number;
}

export function Header({ isAuthenticated = false, user, notificationCount = 0 }: HeaderProps) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/matches", label: "Matches", icon: Users },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ];

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
            <img 
              src="/branding/logo/mentorfy-logo.svg" 
              alt="Mentorfy" 
              className="h-8 w-8 dark:hidden"
            />
            <img 
              src="/branding/logo/mentorfy-logo-dark.svg" 
              alt="Mentorfy" 
              className="h-8 w-8 hidden dark:block"
            />
            <span className="font-semibold text-lg hidden sm:block">Mentorfy</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    className="gap-2"
                    data-testid={`link-nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-testid="button-notifications"
                  onClick={() => navigate("/matches")}
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Badge>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                      data-testid="button-user-menu"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      data-testid="menu-item-dashboard"
                      onClick={() => navigate("/dashboard")}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-item-profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-item-settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      data-testid="menu-item-logout"
                      onClick={async () => {
                        await logout();
                        window.location.href = "/";
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      data-testid="button-mobile-menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <nav className="flex flex-col gap-2 mt-6">
                      {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant={location === item.href ? "secondary" : "ghost"}
                            className="w-full justify-start gap-2"
                            onClick={() => setMobileOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        </Link>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild data-testid="button-sign-in">
                  <a href="/login">Welcome back</a>
                </Button>
                <Button asChild data-testid="button-create-account">
                  <a href="/signup">Create an account</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
