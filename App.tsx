import React, { useState, useEffect, useRef } from 'react';
import { AppView, LessonTopic, LessonLevel, ChatMessage } from './types';
import { generateLessonContent, sendChatMessage } from './services/geminiService';
import { LessonCard } from './components/LessonCard';
import { Button } from './components/Button';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, MessageCircle, Sparkles, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

// Hardcoded curriculum
const TOPICS: LessonTopic[] = [
  {
    id: 'basics-1',
    title: 'What is Programming?',
    description: 'Understand how we talk to computers using simple commands.',
    icon: 'cpu',
    level: LessonLevel.BEGINNER,
  },
  {
    id: 'logic-1',
    title: 'Making Decisions',
    description: 'How computers choose between "Yes" and "No" using Logic.',
    icon: 'globe',
    level: LessonLevel.BEGINNER,
  },
  {
    id: 'variables-1',
    title: 'Memory Boxes',
    description: 'Understanding Variables: How computers remember names and numbers.',
    icon: 'book',
    level: LessonLevel.BEGINNER,
  },
  {
    id: 'loops-1',
    title: 'Doing It Again',
    description: 'Using Loops to repeat tasks without getting tired.',
    icon: 'code',
    level: LessonLevel.INTERMEDIATE,
  }
];

// Add Web Speech API types support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [currentTopic, setCurrentTopic] = useState<LessonTopic | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const handleTopicSelect = async (topic: LessonTopic) => {
    setCurrentTopic(topic);
    setView(AppView.LESSON);
    setIsLoading(true);
    setLessonContent(''); // Clear previous
    setChatHistory([]); // Clear chat

    const content = await generateLessonContent(topic.title);
    setLessonContent(content);
    setIsLoading(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userMessage.trim() || isChatLoading) return;

    const newMessage: ChatMessage = { role: 'user', text: userMessage };
    setChatHistory(prev => [...prev, newMessage]);
    setUserMessage('');
    setIsChatLoading(true);

    const response = await sendChatMessage(chatHistory, newMessage.text, lessonContent);
    
    setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setIsChatLoading(false);

    if (isSpeechEnabled) {
      speakText(response);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for seniors
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSpeech = () => {
    const newState = !isSpeechEnabled;
    setIsSpeechEnabled(newState);
    if (!newState) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      // Stop listening logic is handled by the recognition object ending, 
      // but we can force state reset here if needed.
      setIsListening(false);
      // Note: The actual recognition instance isn't stored in state to call .stop(), 
      // but clicking the button again usually implies the user is done.
      // For simplicity in this stateless-ish function, we rely on the browser's natural timeout 
      // or let the user click send.
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("I'm sorry, but your browser doesn't support voice typing. Please try using Google Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserMessage((prev) => {
        // Add a space if there is already text
        return prev + (prev.length > 0 ? ' ' : '') + transcript;
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Sparkles className="text-emerald-700 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">SilverScript</h1>
              <p className="text-sm text-slate-500 hidden sm:block">Coding made simple, just for you.</p>
            </div>
          </div>
          
          {view === AppView.LESSON && (
             <button
             onClick={toggleSpeech}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors border-2 ${isSpeechEnabled ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
             aria-pressed={isSpeechEnabled}
             aria-label="Toggle voice narration"
           >
             {isSpeechEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
             <span className="text-lg hidden md:inline">{isSpeechEnabled ? "Voice On" : "Voice Off"}</span>
           </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* HOME VIEW */}
          {view === AppView.HOME && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-indigo-50 border-l-8 border-indigo-500 p-6 rounded-r-xl">
                <h2 className="text-3xl font-bold text-indigo-900 mb-2">Welcome back!</h2>
                <p className="text-xl text-indigo-800 leading-relaxed">
                  Learning a new skill keeps the mind sharp. Select a topic below to begin your journey into the world of computers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TOPICS.map(topic => (
                  <LessonCard key={topic.id} topic={topic} onClick={handleTopicSelect} />
                ))}
              </div>
              
              <div className="mt-12 text-center bg-white p-8 rounded-2xl border border-slate-200">
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">Why learn code now?</h3>
                <div className="flex flex-wrap justify-center gap-8 text-left">
                  <div className="flex items-start gap-3 max-w-xs">
                    <div className="bg-emerald-100 p-2 rounded-full mt-1">✓</div>
                    <p className="text-lg text-slate-700">Understand the technology your grandchildren use.</p>
                  </div>
                  <div className="flex items-start gap-3 max-w-xs">
                    <div className="bg-emerald-100 p-2 rounded-full mt-1">✓</div>
                    <p className="text-lg text-slate-700">Keep your brain active and healthy with logic puzzles.</p>
                  </div>
                  <div className="flex items-start gap-3 max-w-xs">
                    <div className="bg-emerald-100 p-2 rounded-full mt-1">✓</div>
                    <p className="text-lg text-slate-700">It's fun, creative, and free!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LESSON VIEW */}
          {view === AppView.LESSON && (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              
              {/* Left Column: Content */}
              <div className="w-full lg:w-7/12 flex flex-col gap-4">
                <Button 
                  variant="outline" 
                  size="normal" 
                  onClick={() => {
                    setView(AppView.HOME);
                    window.speechSynthesis.cancel();
                  }}
                  className="self-start mb-2"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" /> Back to Topics
                </Button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-grow min-h-[500px]">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mb-6"></div>
                      <p className="text-xl text-slate-600 font-medium">Please wait a moment...</p>
                      <p className="text-lg text-slate-500">We are preparing your lesson on {currentTopic?.title}.</p>
                    </div>
                  ) : (
                    <article className="prose prose-slate prose-lg max-w-none p-8 md:p-10">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-4xl font-bold text-emerald-900 mb-6 pb-4 border-b-2 border-emerald-100" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-3xl font-semibold text-emerald-800 mt-8 mb-4" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-2xl font-medium text-emerald-700 mt-6 mb-3" {...props} />,
                          p: ({node, ...props}) => <p className="text-xl leading-loose text-slate-700 mb-6" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-3 mb-6 text-xl text-slate-700" {...props} />,
                          li: ({node, ...props}) => <li className="pl-2" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-emerald-900 bg-emerald-50 px-1 rounded" {...props} />,
                          code: ({node, ...props}) => <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-lg font-mono" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-400 pl-4 italic bg-slate-50 p-4 rounded-r-lg my-6 text-slate-700" {...props} />,
                        }}
                      >
                        {lessonContent}
                      </ReactMarkdown>
                      <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center text-center">
                        <p className="text-xl text-slate-600 mb-6">Have you finished reading?</p>
                        <div className="flex gap-4">
                            <Button onClick={() => {
                                const element = document.getElementById('chat-section');
                                element?.scrollIntoView({behavior: 'smooth'});
                            }}>
                                Ask Tutor a Question
                            </Button>
                        </div>
                      </div>
                    </article>
                  )}
                </div>
              </div>

              {/* Right Column: Chat Tutor */}
              <div id="chat-section" className="w-full lg:w-5/12 flex flex-col h-[600px] lg:h-auto lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <MessageCircle className="text-emerald-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900">Your Personal Tutor</h3>
                    <p className="text-sm text-emerald-700">Ask me anything! I'm here to help.</p>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {chatHistory.length === 0 && !isLoading && (
                    <div className="text-center p-6 mt-10 opacity-70">
                       <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                         <span className="text-4xl">👋</span>
                       </div>
                       <p className="text-lg text-slate-600">Hi there! I'm your coding companion.</p>
                       <p className="text-lg text-slate-600">Read the lesson on the left, and ask me if anything is confusing.</p>
                    </div>
                  )}
                  
                  {chatHistory.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          max-w-[85%] rounded-2xl p-4 text-lg shadow-sm leading-relaxed
                          ${msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }
                        `}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                    <div className="relative">
                      <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        placeholder="Type your question or use the microphone..."
                        className="w-full p-4 pr-16 text-lg border-2 border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none min-h-[80px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={toggleMicrophone}
                        className={`absolute bottom-3 right-3 p-3 rounded-full transition-all duration-300 ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        aria-label={isListening ? "Stop listening" : "Start voice input"}
                        title="Click to speak"
                      >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                      </button>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!userMessage.trim() || isChatLoading}
                      className="w-full"
                      size="large"
                    >
                      Send Question
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;