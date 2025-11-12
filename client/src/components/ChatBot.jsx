import { useState } from 'react';
import { X, Send, MessageCircle, Minimize2 } from 'lucide-react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hallo! 👋 Ich bin Coury, dein Courierly-Helfer! Wie kann ich dir heute helfen?',
      options: [
        'Preis berechnen',
        'Wie funktioniert es?',
        'Lieferzeiten',
        'Kontakt'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const faqResponses = {
    'preis berechnen': {
      text: 'Gerne! Um einen Preis zu berechnen, benötige ich:\n\n📍 Abholadresse\n📍 Lieferadresse\n📦 Fahrzeugtyp\n\nMöchtest du jetzt einen Preis berechnen?',
      options: ['Ja, Preis berechnen', 'Mehr Infos', 'Zurück']
    },
    'wie funktioniert es': {
      text: '🚀 So einfach geht\'s:\n\n1️⃣ Adressen eingeben\n2️⃣ Fahrzeug wählen\n3️⃣ Preis erhalten\n4️⃣ Auftrag bestätigen\n5️⃣ Kurier kommt!\n\nWas möchtest du wissen?',
      options: ['Preis berechnen', 'Fahrzeugtypen', 'Lieferzeiten', 'Zurück']
    },
    'lieferzeiten': {
      text: '⏱️ Unsere Lieferzeiten:\n\n🚀 Express: 1-2 Stunden\n📦 Standard: 3-6 Stunden\n🌙 Overnight: Nächster Tag\n\nVerfügbar 24/7 in ganz Deutschland!',
      options: ['Preis berechnen', 'Fahrzeugtypen', 'Zurück']
    },
    'kontakt': {
      text: '📞 Kontaktiere uns:\n\n📧 info@courierly.de\n📱 +49 (0)172 421 66 72\n🌐 www.courierly.de\n\nWir sind 24/7 für dich da!',
      options: ['Preis berechnen', 'Mehr Infos', 'Zurück']
    },
    'fahrzeugtypen': {
      text: '🚗 Unsere Fahrzeuge:\n\n🚙 Kleintransporter (bis 1000kg)\n🚚 Mittlerer Transporter (bis 2000kg)\n🚛 Großer Transporter (bis 3500kg)\n🏗️ Mit Hebebühne verfügbar\n\nWelches brauchst du?',
      options: ['Preis berechnen', 'Lieferzeiten', 'Zurück']
    },
    'ja, preis berechnen': {
      text: 'Super! Ich leite dich zum Preisrechner weiter... 🚀',
      action: 'calculate'
    },
    'zurück': {
      text: 'Kein Problem! Wie kann ich dir sonst helfen?',
      options: [
        'Preis berechnen',
        'Wie funktioniert es?',
        'Lieferzeiten',
        'Kontakt'
      ]
    },
    'mehr infos': {
      text: 'Was möchtest du genauer wissen?',
      options: [
        'Wie funktioniert es?',
        'Fahrzeugtypen',
        'Lieferzeiten',
        'Kontakt'
      ]
    }
  };

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = { type: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Find response
    setTimeout(() => {
      const normalizedText = text.toLowerCase().trim();
      const response = faqResponses[normalizedText] || {
        text: 'Entschuldigung, das habe ich nicht verstanden. 😅\n\nWähle eine der Optionen oder frage mich etwas anderes!',
        options: [
          'Preis berechnen',
          'Wie funktioniert es?',
          'Lieferzeiten',
          'Kontakt'
        ]
      };

      // Handle actions
      if (response.action === 'calculate') {
        setMessages(prev => [...prev, { type: 'bot', text: response.text }]);
        setTimeout(() => {
          document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
          setIsOpen(false);
        }, 1000);
        return;
      }

      setMessages(prev => [...prev, { type: 'bot', text: response.text, options: response.options }]);
    }, 500);
  };

  const handleOptionClick = (option) => {
    handleSendMessage(option);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Chat öffnen"
        >
          {/* Mascot Image */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 animate-bounce-slow">
              <img 
                src="/coury-mascot.png" 
                alt="Coury Maskottchen" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="text-white text-3xl">🤖</div>';
                }}
              />
            </div>
            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
              1
            </div>
            {/* Speech Bubble */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium">
                Brauchst du Hilfe? 👋
                <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <img 
                  src="/coury-mascot.png" 
                  alt="Coury" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="text-white text-2xl">🤖</div>';
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">Coury</h3>
                <p className="text-xs text-primary-100">Dein Courierly-Helfer</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Minimieren"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.type === 'bot' && (
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <img 
                          src="/coury-mascot.png" 
                          alt="Coury" 
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="text-primary-600 text-sm">🤖</div>';
                          }}
                        />
                      </div>
                      <div>
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                          <p className="text-gray-800 text-sm whitespace-pre-line">{message.text}</p>
                        </div>
                        {message.options && (
                          <div className="mt-2 space-y-2">
                            {message.options.map((option, optIndex) => (
                              <button
                                key={optIndex}
                                onClick={() => handleOptionClick(option)}
                                className="block w-full text-left px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-medium transition-colors"
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {message.type === 'user' && (
                    <div className="bg-primary-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm">
                      <p className="text-sm">{message.text}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Schreibe eine Nachricht..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Senden"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
