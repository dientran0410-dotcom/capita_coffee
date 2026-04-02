import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

type ActionType = "danger" | "safe" | "detail";

interface DropdownAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  type?: ActionType;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionDropdownProps {
  actions: DropdownAction[];
}

const actionStyleMap: Record<ActionType | "default", string> = {
  danger: "text-red-600 hover:bg-red-50 active:bg-red-100",
  safe: "text-green-600 hover:bg-green-50 active:bg-green-100",
  detail: "text-blue-600 hover:bg-blue-50 active:bg-blue-100",
  default: "text-gray-600 hover:bg-gray-50 active:bg-gray-100",
};

const iconStyleMap: Record<ActionType | "default", string> = {
  danger: "text-red-500",
  safe: "text-green-500",
  detail: "text-blue-500",
  default: "text-gray-500",
};

const ActionDropdown = ({ actions }: ActionDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside → close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Calculate dropdown position and direction
  useEffect(() => {
    if (open && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 200; // Approximate height
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;

        // Determine if should open upward
        const shouldDropUp =
          spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
        setDropUp(shouldDropUp);

        // Calculate position
        setPosition({
          top: shouldDropUp ? buttonRect.top - 8 : buttonRect.bottom + 8,
          left: buttonRect.right - 224, // 224px = w-56 (14rem * 16px)
        });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [open]);

  return (
    <>
      <div ref={ref} className="relative inline-block">
        {/* 3 dots */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 ease-in-out transform active:scale-95"
          aria-label="Actions"
        >
          <MoreVertical size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Dropdown - Render vào body bằng Portal */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`fixed z-[9999] w-56 rounded-lg bg-white border border-gray-200 shadow-lg animate-slideDown ${
              dropUp ? "origin-bottom" : "origin-top"
            }`}
            style={{
              top: dropUp ? "auto" : `${position.top}px`,
              bottom: dropUp
                ? `${window.innerHeight - position.top}px`
                : "auto",
              left: `${position.left}px`,
            }}
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              const actionType =
                action.type || (action.danger ? "danger" : "default");
              const isDisabled = action.disabled;
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!isDisabled) {
                      action.onClick();
                      setOpen(false);
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 whitespace-nowrap
                  ${index === 0 ? "rounded-t-lg" : ""}
                  ${index === actions.length - 1 ? "rounded-b-lg" : ""}
                  ${
                    isDisabled
                      ? "text-gray-400 cursor-not-allowed opacity-50"
                      : actionStyleMap[actionType]
                  }
                `}
                  title={
                    isDisabled
                      ? "Không thể chỉnh sửa sự kiện đã và đang diễn ra"
                      : undefined
                  }
                >
                  {Icon && (
                    <Icon
                      size={16}
                      className={
                        isDisabled ? "text-gray-400" : iconStyleMap[actionType]
                      }
                    />
                  )}

                  <span className="font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};

export default ActionDropdown;
