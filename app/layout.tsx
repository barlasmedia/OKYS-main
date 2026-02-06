import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/layout/sidebar";
import Topbar from "../components/layout/topbar";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: "OKYS - Okul Yönetim ve Görev Sistemi",
    description: "Okul ders programı ve görev planlama sistemi",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
            <body className="flex font-sans bg-background text-foreground min-h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
