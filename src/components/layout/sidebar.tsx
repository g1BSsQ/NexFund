"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, formatAddress } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Wallet, 
  User, 
  List, 
  LogOut 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWallet } from '@meshsdk/react';
import { useEffect, useState } from 'react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { wallet } = useWallet();
  const [address, setAddress] = useState('');

  useEffect(() => {
    async function fetchAddress() {
      if (wallet) {
        const addr = await wallet.getChangeAddress();
        setAddress(addr);
      }
    }
    fetchAddress();
  }, [wallet]);

  
  const routes = [
    {
      href: `/dashboard/${address}`,
      icon: LayoutDashboard,
      title: 'Tổng quan',
    },
    {
      href: `/finances/${address}`,
      icon: Wallet,
      title: 'Tài chính',
    },
    {
      href: `/profile/${address}`,
      icon: User,
      title: 'Hồ sơ',
    },
    {
      href: '/funds',
      icon: List,
      title: 'Danh sách quỹ',
    },
  ];

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-gray-950 border-r border-primary/10",
      className
    )}>
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-x-2">
          <span className="text-2xl font-bold gradient-text">DanoFund</span>
        </Link>
      </div>
      <div className="flex-1 flex flex-col px-3 py-4">
        <nav className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-x-2 text-slate-600 dark:text-slate-400 text-sm font-medium p-3 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-md transition",
                pathname === route.href && "text-primary dark:text-primary bg-primary/5 dark:bg-primary/10"
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-primary/10">
        <div className="flex items-center gap-x-3">
          <Avatar>
            <AvatarImage src="/avatar.png" />
            <AvatarFallback className="bg-primary text-white">BF</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatAddress(address)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}