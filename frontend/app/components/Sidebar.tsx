import { useRef } from "react";

export function Sidebar({ children }: any) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const startResize = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
  };

  const endResize = () => {
    isResizing.current = false;
    document.body.style.cursor = "default";
  };

  return (
    <div
      ref={sidebarRef}
      className="
              col-span-1 grid grid-rows-2
              border-r"
    >
      {children}
      <div onMouseDown={startResize} className=""></div>
    </div>
  );
}
