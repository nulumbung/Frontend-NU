import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nulumbung.or.id";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin",
                "/admin/*",
                "/api/*",
                "/private/*",
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
