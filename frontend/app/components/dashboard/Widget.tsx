export function Widget({ children, title, className }: any) {
  return (
    <div className={`flex-1 flex flex-col min-h-0 h-full ${className ?? ""}`}>
      <Header title={title} />
      <WidgetBody>{children}</WidgetBody>
    </div>
  );
}

const Header = ({ title }: any) => {
  return (
    <div
      className="
    p-3 font-bold
    bg-widget-titlebar
    border-1 border-widget-titlebar-border
    rounded-t-md
    flex-none"
    >
      {title}
    </div>
  );
};

const WidgetBody = ({ children }: any) => {
  return (
    <div
      className="
  bg-widget-bg
  border-1 border-widget-border
  flex-1 flex flex-col
  rounded-b-md
  min-h-0"
    >
      {children}
    </div>
  );
};
