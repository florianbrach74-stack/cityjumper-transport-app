import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTranslation } from '../hooks/useTranslation';
import { agbContent } from '../content/agb';

export default function AGBNew() {
  const navigate = useNavigate();
  const { language, easyLanguage } = useTranslation();
  
  const lang = easyLanguage && language === 'de' ? 'de_easy' : language;
  const content = agbContent[lang] || agbContent.de;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <FileText className="h-10 w-10 text-primary-600 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {content.title}
              </h1>
              <p className="text-sm text-gray-600 mt-2">{content.lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {content.sections.map((section, index) => (
            <section key={index} className={index > 0 ? 'border-t border-gray-200 pt-8' : ''}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {section.title}
              </h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {language === 'en' ? 'Back to Home' : easyLanguage ? 'Zurück zur Start-Seite' : 'Zurück zur Startseite'}
          </button>
        </div>
      </div>
    </div>
  );
}
