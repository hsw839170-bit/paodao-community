'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import { safeGetItem } from '@/lib/storage';

interface NavbarProps {
  isRunnerMode?: boolean;
}

export default function Navbar({ isRunnerMode = false }: NavbarProps) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查登录状态
    const token = safeGetItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const navItems = [
    { href: '/', label: '首页', active: pathname === '/' },
    { href: '/leaderboard', label: '排行榜', active: pathname === '/leaderboard' },
    { href: '/profile', label: '个人中心', active: pathname.startsWith('/profile') },
  ];

  return (
    <nav className="flex items-center justify-between gap-2 mb-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg shrink-0">
        <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-sm">
          D
        </span>
        <span className="hidden sm:inline">DeltaRun</span>
      </Link>

      {/* 导航项 */}
      <div className="flex items-center gap-1 sm:gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              item.active
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
        
        {/* 通知铃铛 - 仅在登录状态显示 */}
        {isLoggedIn && (
          <div className="hidden sm:block">
            <NotificationBell />
          </div>
        )}
        
        {/* 我是老板 / 我要入驻 */}
        {isRunnerMode ? (
          <Link
            href="/boss"
            className="px-3 sm:px-4 py-2 rounded-full text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition whitespace-nowrap"
          >
            我是老板
          </Link>
        ) : (
          <Link
            href="/register?role=RUNNER"
            className="px-3 sm:px-4 py-2 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-500 transition whitespace-nowrap"
          >
            我要入驻
          </Link>
        )}
      </div>
    </nav>
  );
}
