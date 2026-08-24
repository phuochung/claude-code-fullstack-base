"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, type User } from '@/api/services/auth';

export function useAuth(requireAuth: boolean = true) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = () => {
            const currentUser = authService.getCurrentUser();
            const isAuthenticated = authService.isAuthenticated();

            setUser(currentUser);
            setIsLoading(false);

            // If authentication is required but user is not authenticated
            if (requireAuth && !isAuthenticated) {
                const redirect = pathname !== '/' ? `?redirect=${pathname}` : '';
                router.push(`/signin${redirect}`);
                return;
            }

            // If user is authenticated and trying to access signin page
            if (!requireAuth && isAuthenticated && pathname === '/signin') {
                router.push('/');
                return;
            }
        };

        checkAuth();
    }, [requireAuth, router, pathname]);

    return { user, isLoading, isAuthenticated: !!user };
}
