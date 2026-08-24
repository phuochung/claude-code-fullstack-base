import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/constants/auth';

// POST /api/auth — set auth cookie on dashboard domain
export async function POST(request: NextRequest) {
    const { token } = await request.json() as { token: string };

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        maxAge: AUTH_COOKIE_MAX_AGE,
        path: '/',
    });
    return response;
}

// DELETE /api/auth — clear auth cookie
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
    return response;
}
