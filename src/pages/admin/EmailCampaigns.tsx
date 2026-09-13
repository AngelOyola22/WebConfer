import React, { useState } from 'react';
import { ContactManager } from '../../components/admin/ContactManager';
import { EmailEditor } from '../../components/admin/EmailEditor';

export const EmailCampaigns: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'compose'>('contacts');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  // En una app real esto vendría de un parámetro en la URL o de un selector de eventos
  const mockEventId = "00000000-0000-0000-0000-000000000000";

  const handleSendCampaign = async () => {
    if (!subject || !htmlContent) {
      alert("Por favor completa el asunto y el cuerpo del correo.");
      return;
    }
    
    // Aquí se llamaría a la API de Supabase para guardar la campaña en estado 'queued'
    alert("Campaña guardada en cola. Los correos se enviarán progresivamente.");
  };

  return (
    <div className="email-campaigns-page p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Gestión de Correos del Evento</h1>

      <div className="tabs border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'contacts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('contacts')}
        >
          1. Importar Destinatarios
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'compose' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('compose')}
        >
          2. Redactar y Enviar
        </button>
      </div>

      {activeTab === 'contacts' && (
        <div>
          <p className="text-gray-600 mb-4">
            Importa la lista de contactos desde un archivo Excel o CSV, o añádelos manualmente. Estos contactos serán los destinatarios de la campaña de correo.
          </p>
          <ContactManager 
            eventId={mockEventId} 
            onContactsImported={(contacts) => console.log('Contactos importados:', contacts)} 
          />
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setActiveTab('compose')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Siguiente: Redactar Correo &rarr;
            </button>
          </div>
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="compose-section bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Redactar Correo</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Asunto del Correo
            </label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: ¡No te pierdas nuestro próximo evento!"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Cuerpo del Correo (HTML)
            </label>
            <EmailEditor 
              initialValue={htmlContent} 
              onChange={setHtmlContent} 
            />
            <p className="text-xs text-gray-500 mt-2">
              Puedes usar variables como {'{{nombre}}'} o {'{{apellido}}'} que se reemplazarán automáticamente si el contacto los tiene.
            </p>
          </div>

          <div className="flex justify-between items-center mt-12 border-t pt-4">
            <button 
              onClick={() => setActiveTab('contacts')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              &larr; Volver a Destinatarios
            </button>
            <button 
              onClick={handleSendCampaign}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded shadow-lg hover:bg-green-700 transition transform hover:scale-105"
            >
              Enviar Campaña
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
