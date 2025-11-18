import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';
import { agbContent } from '../content/agb';

export default function AGBNew() {
  const navigate = useNavigate();
  const { language, easyLanguage } = useTranslation();
  
  const lang = easyLanguage && language === 'de' ? 'easy' : language;
  const content = agbContent[lang] || agbContent.de;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="h-10 w-10 text-primary-600 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {content.title}
                </h1>
                <p className="text-sm text-gray-600 mt-2">{content.lastUpdated}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Company Info */}
        {content.company && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-primary-600 mb-4">
              {content.company.name}
            </h2>
            <div className="text-gray-700 space-y-1">
              <p>{content.company.address}</p>
              <p>{content.company.city}</p>
              <p className="mt-3">
                <strong>{language === 'en' ? 'Phone:' : 'Telefon:'}</strong> {content.company.phone}
              </p>
              <p>
                <strong>Email:</strong> <a href={`mailto:${content.company.email}`} className="text-primary-600 hover:underline">{content.company.email}</a>
              </p>
              <p>
                <strong>Website:</strong> <a href={`https://${content.company.website}`} className="text-primary-600 hover:underline">{content.company.website}</a>
              </p>
              {content.company.ustId && (
                <p className="mt-3 text-sm text-gray-600">
                  {language === 'en' ? 'VAT ID:' : 'USt-IdNr.:'} {content.company.ustId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {content.sections.map((section, index) => (
            <section key={index} className={index > 0 ? 'border-t border-gray-200 pt-8' : ''}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {section.title}
              </h2>
              <div className="text-gray-700 space-y-3">
                {section.subsections ? (
                  // Render subsections for Kundenschutzvereinbarung
                  <div className="space-y-6">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex} className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {subsection.title}
                        </h3>
                        <p className="leading-relaxed whitespace-pre-line">
                          {subsection.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : Array.isArray(section.content) ? (
                  section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="leading-relaxed">{section.content}</p>
                )}
              </div>
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
