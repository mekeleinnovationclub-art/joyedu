'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSwitchableRoles } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { GraduationCap, User, Shield, ChevronDown, Loader2 } from 'lucide-react';
import type { ActiveRole } from '@/types';
import toast from 'react-hot-toast';

const roleIcons: Record<ActiveRole, React.ElementType> = {
  STUDENT: User,
  TEACHER: GraduationCap,
  ADMIN: Shield,
};

const roleColors: Record<ActiveRole, string> = {
  STUDENT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20',
  TEACHER: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20',
  ADMIN: 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20',
};

interface RoleSwitcherProps {
  compact?: boolean;
}

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const { user, switchRole, isInitializing } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!user || isInitializing) {
    return null;
  }

  const switchableRoles = getSwitchableRoles(user);
  const currentRole = user.activeRole;
  const RoleIcon = roleIcons[currentRole];

  const handleSwitchRole = async (role: ActiveRole) => {
    if (role === currentRole || isSwitching) return;
    
    setIsSwitching(true);
    setIsOpen(false);
    
    try {
      await switchRole(role);
      toast.success(`Switched to ${role} mode`);
      
      // Redirect to appropriate dashboard
      const dashboardPath = role === 'TEACHER' 
        ? '/teacher' 
        : role === 'ADMIN' 
          ? '/admin' 
          : '/student';
      
      window.location.href = dashboardPath;
    } catch (error) {
      toast.error('Failed to switch role');
      console.error('Role switch error:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (switchableRoles.length <= 1) {
    // Only one role available - show as badge
    return (
      <Badge className={roleColors[currentRole]}>
        <RoleIcon className="h-3 w-3 mr-1" />
        {currentRole}
      </Badge>
    );
  }

  if (compact) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2" disabled={isSwitching}>
            {isSwitching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RoleIcon className="h-4 w-4" />
                <span>{currentRole}</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Switch Mode</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {switchableRoles.map((role) => {
            const Icon = roleIcons[role];
            const isActive = role === currentRole;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleSwitchRole(role)}
                disabled={isActive || isSwitching}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{role}</span>
                {isActive && <Badge variant="secondary" className="ml-auto">Active</Badge>}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={isSwitching}>
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RoleIcon className="h-4 w-4" />
              <span>{currentRole} Mode</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback>
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.firstName} {user.lastName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Switch Mode</DropdownMenuLabel>
        {switchableRoles.map((role) => {
          const Icon = roleIcons[role];
          const isActive = role === currentRole;
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleSwitchRole(role)}
              disabled={isActive || isSwitching}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              <span>{role}</span>
              {isActive && <Badge variant="secondary" className="ml-auto">Active</Badge>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
