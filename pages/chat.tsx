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
import { SyncLoader, BeatLoader } from "react-spinners";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import API_BASE_URL from "@/utils/constants";

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
  const [history, setHistory] = useState<string[][]>([]);
  const [chats, setChats] = useState<
    { id: string; title: string; date: string }[]
  >([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingChats, setLoadingChats] = useState<boolean>(true);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoadingChats(true);
    const savedChats = JSON.parse(localStorage.getItem("chats") || "[]");
    const savedHistory = JSON.parse(localStorage.getItem("history") || "{}");

    setChats(savedChats);
    if (savedChats.length > 0) {
      setCurrentChatId(savedChats[0].id);
      setHistory(savedHistory[savedChats[0].id] || []);
    }
    setLoadingChats(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));

    const allHistories = JSON.parse(localStorage.getItem("history") || "{}");
    allHistories[currentChatId] = history;
    localStorage.setItem("history", JSON.stringify(allHistories));
  }, [chats, history, currentChatId]);

  const sendMessage = async (): Promise<void> => {
    if (!message.trim()) return;

    const newMessage: Message = { sender: "user", text: message };
    setMessages((prev) => [...prev, newMessage]);
    setHistory((prev) => [...prev, [message]]);
    setMessage("");

    if (!chats.find((chat) => chat.id === currentChatId)) {
      const newChat = {
        id: currentChatId,
        title: message,
        date: new Date().toISOString(),
      };
      setChats((prev) => [...prev, newChat]);
    } else {
      setChats((prev) => {
        return prev.map((chat) =>
          chat.id === currentChatId && chat.title.startsWith("Chat")
            ? { ...chat, title: message }
            : chat
        );
      });
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ai/answer-question`, {
        question: message,
        history,
      });

      const { answer } = response.data;

      if (answer) {
        const aiMessage: Message = {
          sender: "ai",
          text: answer,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1][1] = answer;
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to fetch answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setChats((prev) => [
      ...prev,
      {
        id: newChatId,
        title: `New Chat`,
        date: new Date().toISOString(),
      },
    ]);
    setCurrentChatId(newChatId);
    setMessages([]);
    setHistory([]);
  };

  const switchChat = (chatId: string) => {
    setCurrentChatId(chatId);
    const allHistories = JSON.parse(localStorage.getItem("history") || "{}");
    setHistory(allHistories[chatId] || []);
    setMessages(
      allHistories[chatId]
        ?.map(([userMsg, aiMsg]: [string, string]) => [
          { sender: "user", text: userMsg },
          { sender: "ai", text: aiMsg },
        ])
        .flat() || []
    );
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const groupedChats = chats.reduce((acc, chat) => {
    const monthYear = format(new Date(chat.date), "MMMM yyyy");
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(chat);
    return acc;
  }, {} as Record<string, { id: string; title: string; date: string }[]>);

  return (
    <div className="relative flex justify-center items-center bg-[#F2F3F5] min-h-screen">
      {/* Background Noise Effect */}
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
        <div className="p-6 border-r border-gray-300 min-w-64 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">History</h3>
            <button
              className="p-2 text-gray-600 bg-gray-200 rounded-full hover:bg-gray-300"
              title="Create new chat"
              onClick={createNewChat}
            >
              <HiOutlinePencilAlt className="text-xl" />
            </button>
          </div>
          {loadingChats ? (
            <div className="flex items-center justify-center">
              <BeatLoader color="#1E2B3A" />
            </div>
          ) : (
            <ul className="space-y-4 text-sm text-gray-700">
              {Object.entries(groupedChats).map(([monthYear, chats]) => (
                <li key={monthYear}>
                  <h4 className="mb-2 font-bold text-gray-900 text-md">
                    {monthYear}
                  </h4>
                  <ul className="space-y-2">
                    {chats.map((chat) => (
                      <li
                        key={chat.id}
                        className={classNames(
                          "cursor-pointer hover:text-blue-500",
                          chat.id === currentChatId
                            ? "text-blue-500 font-semibold"
                            : ""
                        )}
                        onClick={() => switchChat(chat.id)}
                      >
                        {chat.title}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative flex flex-col flex-grow">
          <div className="p-6 border-b border-gray-300">
            <h1 className="text-2xl font-bold">AI Lawyer</h1>
            <p className="text-sm text-gray-500">
              Your AI-powered legal assistant for navigating complex systems
              worldwide.
            </p>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="text-lg font-semibold text-center text-gray-600">
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
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </motion.div>
            ))}
            {loading && (
              <div className="flex items-center justify-start ml-[5%]">
                <SyncLoader color="#D3D3D3" size={10} speedMultiplier={0.6} />
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-gray-50">
            <div className="flex items-center space-x-4">
              <label className="p-2 text-gray-600 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300">
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

      <div className="absolute bottom-0 left-0 right-0 p-4 text-sm text-center text-gray-500 bg-gray-100">
        © {new Date().getFullYear()} HighRise Group Ltd. All rights reserved.
      </div>
    </div>
  );
}
