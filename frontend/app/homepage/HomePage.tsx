import Dashboard from "~/components/Dashboard";
import { useState } from "react";


export default function HomePage() {
    const [chatbotInput, setChatbotInput] = useState("");
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    const handleChangeChatbotInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatbotInput(e.target.value);
    }


    return (
        <div className="bg-white min-h-screen">
            <form className="w-full h-36 bg-slate-500 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.25)] pl-5 pr-5 flex gap-4 justify-between items-center" onSubmit={handleSubmit}>
            <input className="w-full h-20 bg-white shadow-[0px_10px_4px_0px_rgba(0,0,0,0.50)] pl-5 text-black text-2xl font-figmaHand" type="text" value={chatbotInput} onChange={handleChangeChatbotInput} placeholder="Ask AI-Advisor..." >
            </input>
            <div className="w-24 h-24 relative">
                <button type="submit" className="w-24 h-24 left-0 top-0 absolute bg-lime-100 rounded-full shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] border border-lime-100 cursor-pointer" />
            </div>
            </form>
            <Dashboard />
        </div>
    );
}