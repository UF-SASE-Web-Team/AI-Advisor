export function Sidebar({ children }: any) {
  return (
    <div
      className="
              col-span-1 grid grid-rows-2
              border-r"
    >
      {children}
    </div>
  );
}
