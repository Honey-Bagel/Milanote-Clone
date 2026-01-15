"use client";

import { Settings, Maximize2, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface MobileToolbarMenuProps {
  onZoomToFit: () => void;
  onOpenSettings: () => void;
  onCreateTemplate?: () => void;
  isAdmin?: boolean;
}

export function MobileToolbarMenu({
  onZoomToFit,
  onOpenSettings,
  onCreateTemplate,
  isAdmin = false,
}: MobileToolbarMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 hover:bg-white/5 rounded-lg text-secondary-foreground transition-colors"
          aria-label="More options"
        >
          <MoreVertical size={20} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onZoomToFit}>
          <Maximize2 size={16} className="mr-2" />
          Zoom to Fit
        </DropdownMenuItem>

        {isAdmin && onCreateTemplate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateTemplate}>
              <FileDown size={16} className="mr-2" />
              Export as Template
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings size={16} className="mr-2" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
