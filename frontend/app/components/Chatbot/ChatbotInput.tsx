export function ChatbotInput({ value, onChange, onSubmit }: any) {
  return (
    <div>
      <form
        onSubmit={onSubmit}
        className="
        flex flex-row gap-2
        m-2
        "
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type="text"
          placeholder="Ask AI-Advisor" // TODO: push text to the right; it's to close to border rn
          className="
          p-2
          bg-white border border-gray-300
          w-full
          rounded-full
          "
        ></input>
        <button
          className="rounded-full
          px-2
          bg-blue-500
          hover:bg-blue-400
          text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
