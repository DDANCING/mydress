import React from 'react';

import { Navbar } from './_components/navbar';
import { Footer } from './_components/footer';
import { StoreThemeBody } from './_components/brand/store-theme-body';
import { storeFontVariables } from './_components/brand/fonts';

import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
}

const Layout = async ({ children }: Props) => {
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;

  return (
    <SessionProvider session={session}>
      <StoreThemeBody />
      <div className={cn("theme-store flex min-h-screen flex-col", storeFontVariables)}>
        <Navbar user={userId ? { id: userId, role } : null} />

        <main className="flex-1">{children}</main>

        <Footer />
      </div>
    </SessionProvider>
  );
};

export default Layout;
