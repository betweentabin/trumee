'use client';

import Link from "next/link";

interface ButtonWithIconProps {
    label: string;
    variant: "primary" | "secondary";
    rounded: boolean;
    Icon?: React.FC;
    href?: string;
    className?: string;
    disabled?: boolean;
    isLoading?: boolean;
    onClick?: () => void;
}

export default function ButtonWithIcon({
    label,
    variant,
    rounded,
    Icon,
    href,
    disabled,
    isLoading,
    className,
    onClick,
}: ButtonWithIconProps) {
    return href ? (
        <Link
            href={href}
            className={`px-8 py-2 flex items-center justify-center gap-x-2 ${rounded ? "rounded-full" : "rounded-lg"} ${variant === "primary" ? "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white" : "bg-secondary-900 hover:bg-secondary-800 active:bg-secondary-700 text-white"} shadow-md relative truncate cursor-pointer ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className ?? ""}`}
        >
            {label}
            {
                isLoading && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-secondary-300 border-t-primary-600" />
                )
            }
            {Icon && (
                <div className="absolute right-2">
                    <Icon />
                </div>
            )}          
        </Link>
    ) : (
        <button
            className={`px-8 py-2 flex items-center justify-center gap-x-2 ${rounded ? "rounded-full" : "rounded-lg"} ${variant === "primary" ? "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white" : "bg-secondary-900 hover:bg-secondary-800 active:bg-secondary-700 text-white"} shadow-md relative truncate cursor-pointer ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className ?? ""}`}
            disabled={disabled}
            onClick={onClick}
        >   
            <span className="text-base flex flex-row gap-2 items-center">
                {label}
                {
                    isLoading && (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-secondary-300 border-t-primary-600" />
                    )
                }
            </span>
            {Icon && (
                <div className="absolute right-2">
                    <Icon />
                </div>
            )}
        </button>
    )
}
