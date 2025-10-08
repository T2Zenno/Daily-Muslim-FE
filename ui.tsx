import React, { useState, useEffect, useCallback } from 'react';

export const Icon = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <span className={`inline-block w-6 text-center ${className}`}>{children}</span>
);

export const Pill = React.memo(({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`flex items-center gap-2 rounded-full border border-slate-200 dark:border-brand-line bg-slate-100 dark:bg-brand-card px-3 py-1.5 ${className}`}>
        {children}
    </div>
));

export const Badge = React.memo(({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <span className={`whitespace-nowrap rounded-full border border-slate-300 dark:border-brand-line px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 ${className}`}>
        {children}
    </span>
));

// FIX: Added `disabled` prop to the Button component to allow buttons to be disabled.
export const Button = ({ children, onClick, className = '', type = 'button', disabled }: { children: React.ReactNode, onClick?: () => void, className?: string, type?: 'button' | 'submit', disabled?: boolean }) => (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-lg border border-slate-300 dark:border-brand-line bg-slate-100 hover:bg-slate-200 dark:bg-brand-card px-4 py-2 font-semibold text-slate-800 dark:text-brand-text transition hover:border-slate-400 dark:hover:border-slate-700 disabled:opacity-50 ${className}`}>
        {children}
    </button>
);

export const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = useCallback(() => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, [toggleVisibility]);

    return (
        <>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-5 right-5 z-50 rounded-full bg-sky-500 p-3 text-white shadow-lg transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:bg-sky-600 dark:hover:bg-sky-700 dark:focus:ring-offset-brand-bg"
                    aria-label="Scroll to top"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            )}
        </>
    );
};

export const LoadingPopup: React.FC = () => (
    <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-slate-800 text-white p-3 shadow-lg">
        Loading...
    </div>
);
