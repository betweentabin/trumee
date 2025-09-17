'use client';

import Link from "next/link";

interface DefaultButtonProps {
    label: string;
    variant: "primary" | "secondary";
    rounded: boolean;
    href?: string;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

export default function DefaultButton({
    label,
    variant,
    rounded,
    href,
    className,
    onClick,
    disabled,
}: DefaultButtonProps) {
    return href ? (
        <Link
            href={href}
            className={`px-8 py-2 flex items-center justify-center gap-x-2 ${rounded ? "rounded-full" : "rounded-lg"} ${variant === "primary" ? "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white" : "bg-secondary-900 hover:bg-secondary-800 active:bg-secondary-700 text-white"} relative ${className ?? ""}`}
        >
            {label}
        </Link>
    ) : (
        <button
            disabled={disabled}
            className={`px-8 py-2 flex items-center justify-center gap-x-2 ${rounded ? "rounded-full" : "rounded-lg"} ${variant === "primary" ? "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white" : "bg-secondary-900 hover:bg-secondary-800 active:bg-secondary-700 text-white"} relative ${className ?? ""} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onClick}
        >
            {label}
        </button>
    )
}
