"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export default function InstallPwaPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Hide the app provided install promotion
        setIsVisible(false);
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl p-4 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
            <div className="relative w-12 h-12 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
                <Image
                    src="/images/logos/logo.png"
                    alt="App Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                    Installer l'application
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate">
                    Ajoutez Mellia POS à votre bureau
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleInstallClick}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                    Installer
                </button>
                <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                    aria-label="Fermer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
