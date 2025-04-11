'use client';

import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, ClipboardList } from 'lucide-react';

export default function Header() {
  const { user, logout, isAuthenticated } = useUser();

  // Get the first letter of the user's name for avatar
  const getInitials = () => {
    if (!user) return 'U';
    
    // Always prioritize name first if available
    if (user.name && user.name.trim()) {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length > 1) {
        // Return first letter of first and last name
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      return user.name.trim().charAt(0).toUpperCase();
    }
    
    // Fall back to email if name is not available
    if (user.email && user.email.trim()) {
      return user.email.trim().charAt(0).toUpperCase();
    }
    
    // Last resort: use employee ID
    return user.empId.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            OKR Tree Software
          </Link>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link href="/tasks" className="hover:text-slate-300 flex items-center gap-2">
              <ClipboardList size={18} />
              <span>Your Tasks</span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-700">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <p className="text-sm font-medium">
                    {user?.name || `User ${user?.empId}`}
                  </p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer text-red-500 focus:text-red-500 flex items-center gap-2"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button variant="default">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
} 