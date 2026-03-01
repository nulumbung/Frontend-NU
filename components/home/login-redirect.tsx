'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export function LoginRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get('login') === 'true') {
            router.replace('/admin/login');
        }
    }, [searchParams, router]);

    return null;
}
