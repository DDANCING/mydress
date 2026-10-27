import React from 'react';

import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import { db } from '@/lib/db';
import { Sidebar } from './_components/sidebar';
import { notFound } from 'next/navigation';
;

interface Props {
  children: React.ReactNode;
}


 
const ProfileLayout = async ({ children }: Props) => {
  const session = await auth();
  const userEmail = session?.user.email;
  const userName = session?.user.name;

  if (!userEmail) {
    return notFound();
  }

  // Try to find existing buyer by email first
  let buyerWithOrders = await db.buyer.findUnique({
    where: {
      email: userEmail,
    },
  });

  // If not found by email, try a more comprehensive search
  if (!buyerWithOrders) {
    try {
      buyerWithOrders = await db.buyer.findFirst({
        where: {
          OR: [
            { email: userEmail },
            // Add other potential matching criteria if needed
          ]
        }
      });
    } catch (searchError) {
      console.error('Error searching for existing buyer:', searchError);
    }
  }

  // If buyer doesn't exist, create one
  if (!buyerWithOrders && userName) {
    try {
      buyerWithOrders = await db.buyer.create({
        data: {
          fullName: userName,
          email: userEmail,
          phone: "",
          address: "",
          city: "",
          state: "",
          cep: "",
          document: null, // Use null instead of empty string to avoid unique constraint issues
          neighborhood: "",
          number: "",
          complement: "",
        },
      });
    } catch (error: any) {
      console.error('Error creating buyer:', error);
      
      // If it's a unique constraint error, try to find the existing buyer
      if (error.code === 'P2002') {
        console.log('Buyer already exists, trying to find existing one...');
        try {
          // Try to find by email again (race condition)
          buyerWithOrders = await db.buyer.findUnique({
            where: { email: userEmail }
          });
          
          // If still not found and error was on document field, try finding by document
          if (!buyerWithOrders && error.meta?.target?.includes('document')) {
            // This shouldn't happen with null, but just in case
            console.log('Attempting fallback buyer lookup...');
          }
        } catch (fallbackError) {
          console.error('Fallback buyer lookup failed:', fallbackError);
        }
      }
    }
  }


  const buyerName = buyerWithOrders?.fullName || session?.user.name || "";
  const buyerEmailSafe = buyerWithOrders?.email || session?.user.email || "";
  


  return (
    <SessionProvider session={session}>
        <div className="container mx-auto px-4 py-8 mt-14">
       <div className="flex gap-8">
            
            <aside>
              <Sidebar name={buyerName} email={buyerEmailSafe} />
            </aside>
            
      <main className="flex-1 -mt-8 sm:mt-0">
        {children}
      </main>
    </div>
    </div>
    </SessionProvider>
  );
};

export default ProfileLayout;