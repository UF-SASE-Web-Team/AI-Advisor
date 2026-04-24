import type { FormEvent } from "react";

interface ChatbotInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export function ChatbotInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: ChatbotInputProps) {
  return (
    <div className="flex-none">
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
          placeholder="Ask AI-Advisor" // TODO: push text to the right; it's a little close to border rn
          className="
          p-2
          bg-white border border-gray-300
          w-full
          rounded-full
          "
          disabled={disabled}
        ></input>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full
          px-2
          bg-blue-500
          hover:bg-blue-400
          text-white
          disabled:bg-gray-300"
        >
          {disabled ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
