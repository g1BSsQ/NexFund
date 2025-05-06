"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
}


export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const {disconnect, address } = useWallet();
  const [showDisconnect, setShowDisconnect] = useState(false);


  const handleDisconnect = async () => {
    // 1. Xóa state React
    setShowDisconnect(false);
    
    // 2. Xóa dữ liệu localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('wallet') || key.includes('mesh') || key.includes('cardano'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 3. Ngắt kết nối ví
    if (disconnect) {
      await disconnect();
    }
    
    // 4. Chuyển hướng sau khi xong
    window.location.href = '/'; // Dùng window.location thay vì Link hoặc router để tải lại trang hoàn toàn
  };
  
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
          <Image
            src="/logofull.svg" // Đường dẫn đến file logo trong thư mục public
            alt="DanoFund Logo"
            width={150}
            height={40}
            priority
            className="h-auto"
          />
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
      <div className="mt-auto p-4 border-t border-primary/10 relative">
        <div 
          className="flex items-center gap-x-3 cursor-pointer" 
          onClick={() => setShowDisconnect(!showDisconnect)}
        >
              <Avatar >
                <AvatarImage src={`https://avatar.vercel.sh/${address}`} />
                <AvatarFallback className="text-2xl">
                  {address ? address.charAt(0) : "NN"}
                </AvatarFallback>
              </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatAddress(address)}
            </p>
          </div>
        </div>
        
        {showDisconnect && (

            <Button 
              variant="destructive" 
              size="sm"
              className="w-full mt-2 flex items-center justify-center"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Ngắt kết nối
            </Button>
        )}
      </div>
    </div>
  );
}