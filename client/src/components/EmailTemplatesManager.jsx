import React, { useState, useEffect } from 'react';
import { Mail, Edit, Save, X, RotateCcw, Send, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';

const EmailTemplatesManager = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedTemplate, setEditedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Fehler beim Laden der Templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setEditedTemplate({ ...template });
  };

  const handleSave = async () => {
    if (!editedTemplate) return;

    try {
      setSaving(true);
      await api.put(`/email-templates/${editedTemplate.id}`, {
        subject: editedTemplate.subject,
        body: editedTemplate.body
      });
      
      alert('✅ Template erfolgreich gespeichert!');
      setSelectedTemplate(null);
      setEditedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('❌ Fehler beim Speichern des Templates');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (templateId) => {
    if (!confirm('Möchten Sie dieses Template wirklich auf die Standardversion zurücksetzen?')) {
      return;
    }

    try {
      await api.post(`/email-templates/${templateId}/reset`);
      alert('✅ Template wurde zurückgesetzt!');
      fetchTemplates();
      setSelectedTemplate(null);
      setEditedTemplate(null);
    } catch (error) {
      console.error('Error resetting template:', error);
      alert('❌ Fehler beim Zurücksetzen des Templates');
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !selectedTemplate) return;

    try {
      await api.post('/email-templates/test', {
        template_id: selectedTemplate.id,
        test_email: testEmail
      });
      alert(`✅ Test-Email wurde an ${testEmail} gesendet!`);
      setShowTestModal(false);
      setTestEmail('');
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('❌ Fehler beim Senden der Test-Email');
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      invoice: 'bg-blue-100 text-blue-800',
      order: 'bg-green-100 text-green-800',
      notification: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getVariablesForTemplate = (templateKey) => {
    const commonVars = ['{{customer_name}}', '{{company_name}}'];
    
    const specificVars = {
      invoice_reminder_friendly: ['{{invoice_number}}', '{{invoice_date}}', '{{due_date}}', '{{total_amount}}', '{{days_overdue}}'],
      invoice_reminder_urgent: ['{{invoice_number}}', '{{invoice_date}}', '{{due_date}}', '{{total_amount}}', '{{days_overdue}}'],
      invoice_reminder_final: ['{{invoice_number}}', '{{invoice_date}}', '{{due_date}}', '{{total_amount}}', '{{days_overdue}}'],
      order_confirmation: ['{{order_id}}', '{{pickup_city}}', '{{delivery_city}}', '{{pickup_date}}', '{{price}}']
    };

    return [...commonVars, ...(specificVars[templateKey] || [])];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email-Templates</h2>
            <p className="mt-1 text-sm text-gray-600">
              Verwalten Sie Ihre Email-Vorlagen für automatische Benachrichtigungen
            </p>
          </div>
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        
        {/* Explanation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-semibold mb-2">So funktionieren Email-Templates:</p>
              <ul className="space-y-1 text-green-800">
                <li>• <strong>Aktueller Text:</strong> Die Templates enthalten bereits den Standard-Text, der versendet wird</li>
                <li>• <strong>Anpassen:</strong> Klicken Sie auf "Bearbeiten", ändern Sie den Text nach Ihren Wünschen und speichern Sie</li>
                <li>• <strong>Variablen:</strong> Nutzen Sie die verfügbaren Variablen (z.B. {'{'}{'{'} customer_name {'}'}{'}'}), diese werden automatisch mit echten Daten gefüllt</li>
                <li>• <strong>Beispiel:</strong> "Hallo {'{'}{'{'} customer_name {'}'}{'}'}" wird zu "Hallo Max Müller"</li>
                <li>• <strong>Test:</strong> Senden Sie eine Test-Email an sich selbst, um das Ergebnis zu sehen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryBadge(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Betreff:</p>
                    <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Verfügbare Variablen:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {getVariablesForTemplate(template.template_key).map((variable) => (
                        <code key={variable} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center space-x-3">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowTestModal(true);
                  }}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Test senden
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedTemplate && editedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Template bearbeiten: {selectedTemplate.name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setEditedTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.subject}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachricht
                  </label>
                  <textarea
                    value={editedTemplate.body}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, body: e.target.value })}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>

                {/* Variables Help */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Verfügbare Variablen:</p>
                  <div className="flex flex-wrap gap-2">
                    {getVariablesForTemplate(selectedTemplate.template_key).map((variable) => (
                      <code key={variable} className="px-2 py-1 bg-white text-xs rounded border border-blue-200">
                        {variable}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => handleReset(selectedTemplate.id)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Auf Standard zurücksetzen
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setEditedTemplate(null);
                      }}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Speichern
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Test-Email senden</h3>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setTestEmail('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email-Adresse
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                    <p className="text-sm text-yellow-700">
                      Die Test-Email wird mit Beispieldaten gefüllt.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowTestModal(false);
                      setTestEmail('');
                    }}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSendTest}
                    disabled={!testEmail}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Senden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesManager;
