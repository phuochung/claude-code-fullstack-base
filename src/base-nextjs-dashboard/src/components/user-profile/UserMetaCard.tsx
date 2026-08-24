"use client";
import React, { useState, useEffect } from "react";
import { authService } from "@/api/services/auth";

export default function UserMetaCard() {
  const [user, setUser] = useState<{ userId: string; email: string; name: string } | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const currentUser = authService.getCurrentUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount; not available during SSR render
    setUser(currentUser);
  }, []);

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.name || 'User'}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
