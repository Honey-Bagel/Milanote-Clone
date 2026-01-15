"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MobileSearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
}: MobileSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-full sm:max-w-lg h-full sm:h-auto top-0 sm:top-[50%] translate-y-0 sm:translate-y-[-50%]">
        <div className="flex flex-col h-full sm:h-auto">
          {/* Search Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Search size={20} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={18} className="text-secondary-foreground" />
              </button>
            )}
          </div>

          {/* Search Tips */}
          <div className="p-4 flex-1 overflow-auto">
            {!searchQuery ? (
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Start typing to search your boards</p>
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-600">Quick tips:</p>
                  <ul className="text-xs text-slate-600 space-y-1 pl-4">
                    <li>• Search by board name</li>
                    <li>• Press ESC to close</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Searching for: <span className="text-white font-medium">{searchQuery}</span></p>
                <button
                  onClick={onClose}
                  className="mt-4 text-primary hover:text-indigo-400 text-sm"
                >
                  View results →
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
