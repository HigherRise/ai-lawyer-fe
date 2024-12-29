import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineChatAlt,
  HiOutlineDocumentText,
  HiOutlinePaperClip,
  HiOutlineArrowRight,
  HiOutlinePlus,
  HiOutlinePencilAlt,
} from "react-icons/hi";

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

type Message = {
  sender: "user" | "ai";
  text: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<string[]>([
    "What are the steps to register a company?",
    "Explain the appeals process.",
  ]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = (): void => {
    if (!message.trim()) return;
    const newMessage: Message = { sender: "user", text: message };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    setTimeout(() => {
      const aiMessage: Message = {
        sender: "ai",
        text: `AI Lawyer: ${newMessage.text}`,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="relative flex justify-center items-center bg-[#F2F3F5] min-h-screen">
      <svg
        style={{ filter: "contrast(125%) brightness(110%)" }}
        className="fixed z-[1] w-full h-full opacity-[35%]"
      >
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".7"
            numOctaves="3"
            stitchTiles="stitch"
          ></feTurbulence>
          <feColorMatrix type="saturate" values="0"></feColorMatrix>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)"></rect>
      </svg>

      <div className="relative z-10 w-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden flex max-h-[85vh] min-h-[85vh]">
        <div className="w-64 bg-gray-50 border-r border-gray-300 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">History</h3>
            <button
              className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
              title="Create new chat"
              onClick={() => setMessages([])}
            >
              <HiOutlinePencilAlt className="text-xl" />
            </button>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {history.map((item, idx) => (
              <li
                key={idx}
                className="cursor-pointer hover:text-blue-500"
                onClick={() => setMessage(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col flex-grow relative">
          <div className="p-6 border-b border-gray-300">
            <h1 className="text-2xl font-bold">AI Lawyer</h1>
            <p className="text-sm text-gray-500">
              Your AI-powered legal assistant for navigating complex systems
              worldwide.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-center text-gray-600 text-lg font-semibold">
              How can we assist you today?
            </div>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: msg.sender === "user" ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className={
                  msg.sender === "user"
                    ? "ml-auto bg-[#1E2B3A] text-white p-3 rounded-md shadow-none max-w-[60%]"
                    : "mr-auto bg-[#f5f7f9] text-gray-800 p-3 rounded-md shadow-none max-w-[60%]"
                }
              >
                {msg.text}
              </motion.div>
            ))}
            <div ref={messageEndRef} />
          </div>

          <div className="p-6 bg-gray-50">
            <div className="flex items-center space-x-4">
              <label className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 cursor-pointer">
                <HiOutlinePaperClip className="text-xl" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => console.log(e.target.files)}
                />
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                onClick={sendMessage}
                className="group rounded-full px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2 active:scale-95 scale-100 duration-75"
                style={{
                  boxShadow:
                    "0px 1px 4px rgba(13, 34, 71, 0.17), inset 0px 0px 0px 1px #061530, inset 0px 0px 0px 2px rgba(255, 255, 255, 0.1)",
                }}
              >
                <span>Send</span>
                <HiOutlineArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-100 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} HighRise Group Ltd. All rights reserved.
      </div>
    </div>
  );
}
