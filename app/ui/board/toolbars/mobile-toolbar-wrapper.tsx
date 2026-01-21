"use client";

import { ReactNode } from "react";
import { useIsSmallScreen } from "@/lib/hooks/use-media-query";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileToolbarWrapperProps {
  /** Primary actions always visible on mobile */
  primaryActions: ReactNode;
  /** Secondary actions hidden in overflow menu on mobile */
  secondaryActions?: ReactNode;
  /** Right-side actions (e.g., Present, Share buttons) */
  rightActions?: ReactNode;
  /** Optional custom overflow menu trigger */
  overflowTrigger?: ReactNode;
  /** Class name for the toolbar container */
  className?: string;
}

/**
 * Mobile-optimized toolbar wrapper
 * - Shows primary actions inline
 * - Hides secondary actions in overflow menu on small screens
 * - Maintains desktop layout on larger screens
 */
export function MobileToolbarWrapper({
  primaryActions,
  secondaryActions,
  rightActions,
  overflowTrigger,
  className = "",
}: MobileToolbarWrapperProps) {
  const isSmallScreen = useIsSmallScreen();

  return (
    <div className={`bg-[#0f172a]/95 backdrop-blur-sm border-b border-white/10 px-3 sm:px-4 lg:px-6 py-2 flex items-center justify-between shrink-0 z-40 ${className}`}>
      {/* Left side - Primary actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
        {primaryActions}

        {/* Secondary actions - desktop only */}
        {!isSmallScreen && secondaryActions && (
          <>
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            {secondaryActions}
          </>
        )}

        {/* Overflow menu for secondary actions on mobile */}
        {isSmallScreen && secondaryActions && (
          <>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {overflowTrigger || (
                  <button
                    className="p-2 hover:bg-white/5 rounded-lg text-secondary-foreground transition-colors flex-shrink-0"
                    aria-label="More tools"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-[60vh] overflow-y-auto"
              >
                <div className="p-2 space-y-1">{secondaryActions}</div>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Right side actions */}
      {rightActions && (
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
          {rightActions}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-friendly toolbar button component
 * Touch-optimized with minimum 44x44px hit area
 */
interface MobileToolbarButtonProps {
  onClick?: () => void;
  icon: ReactNode;
  label?: string;
  isActive?: boolean;
  className?: string;
  title?: string;
  disabled?: boolean;
}

export function MobileToolbarButton({
  onClick,
  icon,
  label,
  isActive = false,
  className = "",
  title,
  disabled = false,
}: MobileToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]
        p-2 rounded-lg transition-colors
        flex items-center justify-center gap-1.5
        ${isActive
          ? 'bg-primary/20 text-primary'
          : 'text-secondary-foreground hover:text-white hover:bg-white/5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon}
      {label && <span className="text-sm hidden lg:inline">{label}</span>}
    </button>
  );
}

/**
 * Vertical divider for toolbar
 */
export function ToolbarDivider() {
  return <div className="w-px h-6 bg-white/10 mx-1 sm:mx-2 flex-shrink-0"></div>;
}
