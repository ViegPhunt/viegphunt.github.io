import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from 'next/font/local';
import "../styles/globals.css";
import Header from "../components/Header";
import ScrollToTop from '../components/ScrollToTop';
import ChangePage from "../components/ChangePage";
import Footer from "../components/Footer";
import Scrollbar from "../components/Scrollbar";

//  Arial font configuration
const arial = localFont({
    src: [
        { path: '../fonts/arial/Arial.ttf', weight: '400', style: 'normal' },
        { path: '../fonts/arial/Arial-Italic.ttf', weight: '400', style: 'italic' },
        { path: '../fonts/arial/Arial-Bold.ttf', weight: '700', style: 'normal' },
        { path: '../fonts/arial/Arial-BoldItalic.ttf', weight: '700', style: 'italic' },
    ],
    variable: '--font-arial',
    display: 'swap',
});

//  JetBrains Mono font configuration
const jetbrainsMono = localFont({
    src: [
        { path: '../fonts/jetbrains-mono/JetBrainsMonoNerdFont-Regular.ttf', weight: '400', style: 'normal' },
        { path: '../fonts/jetbrains-mono/JetBrainsMonoNerdFont-Italic.ttf', weight: '400', style: 'italic' },
        { path: '../fonts/jetbrains-mono/JetBrainsMonoNerdFont-SemiBold.ttf', weight: '600', style: 'normal' },
        { path: '../fonts/jetbrains-mono/JetBrainsMonoNerdFont-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
        { path: '../fonts/jetbrains-mono/JetBrainsMonoNerdFont-Bold.ttf', weight: '700', style: 'normal' },
        { path: '../fonts/jetbrains-mono/JetBrainsMonoNerdFont-BoldItalic.ttf', weight: '700', style: 'italic' },
    ],
    variable: '--font-jetbrains-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: "ViegPhunt",
    description: "ViegPhunt's personal website",
    icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${arial.variable} ${jetbrainsMono.variable}`}>
            <body className='antialiased' suppressHydrationWarning>
                {/* Page transition animations */}
                <ChangePage />
                {/* Custom scrollbar */}
                <Scrollbar />
                <div className="min-h-screen flex flex-col">
                    <Suspense fallback={<div style={{ height: '80px' }} />}>
                        <Header />
                    </Suspense>
                    <main className="flex-1 w-full site-main">
                        {children}
                    </main>
                    {/* Scroll to top button */}
                    <ScrollToTop />
                    <Footer />
                </div>
            </body>
        </html>
    );
}
