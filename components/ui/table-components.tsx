import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className="premium-table-container">
            <table className={cn("min-w-full divide-y divide-white/[0.05]", className)}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <thead className={cn("bg-white/[0.02] backdrop-blur-md", className)}>
            {children}
        </thead>
    );
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <tbody className={cn("divide-y divide-white/[0.02]", className)}>
            {children}
        </tbody>
    );
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <th className={cn(
            "px-6 py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-[0.2em]",
            className
        )}>
            {children}
        </th>
    );
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <tr className={cn("hover:bg-primary/[0.03] transition-colors group", className)}>
            {children}
        </tr>
    );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <td className={cn("px-6 py-5 whitespace-nowrap text-sm text-foreground/80", className)}>
            {children}
        </td>
    );
}
