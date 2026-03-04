import { useEffect, useRef } from "react";

export function Sidebar({ children }: any) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    window.addEventListener("mousemove", doResize);
    // Mouse down must start on the resize bar, but could end anywhere
    window.addEventListener("mouseup", stopResize);

    return () => {
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };
  });

  const doResize = (e: MouseEvent) => {
    if (!isResizing.current || !sidebarRef.current) return;
    const widthRatio = e.clientX / window.innerWidth;
    if (widthRatio > 0.05) {
      // sidebarRef.current.style.
    }
  };

  const startResize = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
  };

  const stopResize = () => {
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
