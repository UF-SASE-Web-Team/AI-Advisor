import { useEffect, useRef } from "react";

export function Sidebar({ children }: any) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const initWidth = useEffect(() => {
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
    const widthRatio = (e.clientX / window.innerWidth) * 100;
    if (widthRatio > 5) {
      sidebarRef.current.style.width = widthRatio + "vw";
    }
  };

  const startResize = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const stopResize = () => {
    isResizing.current = false;
    document.body.style.cursor = "auto";
    document.body.style.userSelect = "auto";
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: "30vw", minWidth: "20vw", maxWidth: "80vw" }}
      className="
        flex flex-col
        border-r
        relative"
    >
      {children}

      <div
        onMouseDown={startResize}
        className="
        absolute right-0 top-0 h-full w-1
        cursor-col-resize
        "
      ></div>
    </div>
  );
}
