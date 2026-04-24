export function Widget({ children, title, className, titleClassName }: any) {
  return (
    <div className={`flex flex-col ${className || "flex-1"}`}>
      <Header title={title} titleClassName={titleClassName} />
      <WidgetBody>{children}</WidgetBody>
    </div>
  );
}

const Header = ({ title, titleClassName }: any) => {
  return (
    <div
      className={`
    px-2 py-3 font-bold
    bg-widget-titlebar
    border-1 border-widget-titlebar-border
    rounded-t-md
    flex-none
    ${titleClassName || ""}`}
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
