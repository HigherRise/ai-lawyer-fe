import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { HiOutlineArrowRight, HiOutlinePencilAlt } from "react-icons/hi";
import { SyncLoader, BeatLoader } from "react-spinners";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import API_BASE_URL from "@/utils/constants";
import { format, isToday, isYesterday } from "date-fns";

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

type Message = {
  question: string;
  answer: string;
};

type HistoryEntry = {
  _id: string;
  question: string;
  answer: string;
  historyGroup: string; // yyyy-dd-mm format
  date: string;
  createdAt: string;
  updatedAt: string;
};

type HistoryResponse = {
  history: Record<string, HistoryEntry[]>;
  total: number;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [currentChatGroup, setCurrentChatGroup] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingChats, setLoadingChats] = useState<boolean>(true);
  const [token, setToken] = useState<string>("");
  const [history, setHistory] = useState<HistoryResponse>({
    history: {},
    total: 0,
  });

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const fetchHistory = async (accessToken: string): Promise<void> => {
    setLoadingChats(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/history/user-history`,
        {
          params: {
            dateFrom: "",
            dateTo: new Date().toISOString(),
            page: "1",
            limit: "100",
            group: "month",
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setHistory(response.data || { history: {}, total: 0 });
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  const formatHistoryDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const createNewChat = (): void => {
    const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd format
    setHistory((prev) => {
      const newHistory = { ...prev.history };
      if (!newHistory[today]) {
        newHistory[today] = [];
      } else {
        switchChat(today);
      }
      
      const newChatId = Date.now().toString();
      newHistory[today].push({
        _id: newChatId,
        question: "",
        answer: "",
        historyGroup: today,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return {
        ...prev,
        history: newHistory,
        total: prev.total + 1,
      };
    });

    setCurrentChatGroup(today);
    setMessages([]);
  };

  const switchChat = async (chatGroup: string): Promise<void> => {
    const selectedChat = history.history[chatGroup];
    if (selectedChat) {
      setMessages(
        selectedChat.map((entry) => ({
          question: entry.question,
          answer: entry.answer,
        }))
      );
    }
    setCurrentChatGroup(chatGroup);
  };

  const sendMessage = async (): Promise<void> => {
    if (!message.trim()) return;

    const newMessage: Message = { question: message, answer: "" };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/ai/answer-question`,
        { question: message },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "lex_voithos_access_token"
            )}`,
          },
        }
      );

      const { answer } = response.data;
      if (answer) {
        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1].answer = answer;
          return updatedMessages;
        });

        setHistory((prev) => {
          const updatedHistory = { ...prev.history };
          if (!updatedHistory[currentChatGroup]) {
            updatedHistory[currentChatGroup] = [];
          }
          const newChatId = Date.now().toString();
          updatedHistory[currentChatGroup].push({
            _id: newChatId,
            question: message,
            answer: answer,
            historyGroup: currentChatGroup,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          return { ...prev, history: updatedHistory };
        });
      }
    } catch (error) {
      console.error("Failed to fetch answer:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("lex_voithos_access_token");
    if (token) {
      fetchHistory(token);
      setToken(token);
    } else {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="relative flex justify-center items-center bg-[#F2F3F5] min-h-screen">
      <div className="relative z-10 w-full max-w-6xl bg-white shadow-lg rounded-lg overflow-hidden flex max-h-[85vh] min-h-[85vh]">
        {/* Sidebar */}
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
            <div className="space-y-4 text-sm text-gray-700">
              {Object.entries(history.history).map(([date, entries]) => (
                <div key={date}>
                  <h4
                    className={classNames(
                      "hover:text-blue-500",
                      date === currentChatGroup
                        ? "text-blue-500 font-semibold"
                        : "",
                      loading ? "cursor-not-allowed" : "cursor-pointer"
                    )}
                    onClick={loading ? () => {} : () => switchChat(date)}
                  >
                    {formatHistoryDate(date)}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Chat Window */}
        <div className="relative flex flex-col flex-grow">
          <div className="p-6 border-b border-gray-300">
            <h1 className="text-2xl font-bold">AI Lawyer</h1>
            <p className="text-sm text-gray-500">
              Your AI-powered legal assistant for navigating complex systems
              worldwide.
            </p>
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.question && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="ml-auto bg-[#1E2B3A] text-white p-3 rounded-md shadow-none max-w-[60%]"
                  >
                    <ReactMarkdown>{msg.question}</ReactMarkdown>
                  </motion.div>
                )}
                {msg.answer && (
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mr-auto bg-[#f5f7f9] text-gray-800 p-3 rounded-md shadow-none max-w-[60%]"
                  >
                    <ReactMarkdown>{msg.answer}</ReactMarkdown>
                  </motion.div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center justify-start ml-[5%]">
                <SyncLoader color="#D3D3D3" size={10} speedMultiplier={0.6} />
              </div>
            )}
            <div ref={messageEndRef} />
          </div>
          <div className="p-6 bg-gray-50">
            <div className="flex items-center space-x-4">
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
                className="group rounded-full px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white"
              >
                <span>Send</span>
                <HiOutlineArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
