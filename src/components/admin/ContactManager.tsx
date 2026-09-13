import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface Contact {
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ContactManagerProps {
  eventId: string;
  onContactsImported?: (contacts: Contact[]) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({ eventId, onContactsImported }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr !== 'string') return;

      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const parsedContacts: Contact[] = data.map((row: any) => ({
        email: row.email || row.Email || row.correo || row.Correo || '',
        first_name: row.first_name || row.nombre || row.Nombre || '',
        last_name: row.last_name || row.apellido || row.Apellido || '',
      })).filter(c => c.email); // Only keep rows with email

      setContacts(prev => [...prev, ...parsedContacts]);
      if (onContactsImported) onContactsImported(parsedContacts);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail) return;

    const newContact: Contact = {
      email: manualEmail,
      first_name: manualFirstName,
      last_name: manualLastName
    };

    setContacts(prev => [...prev, newContact]);
    if (onContactsImported) onContactsImported([newContact]);

    setManualEmail('');
    setManualFirstName('');
    setManualLastName('');
  };

  return (
    <div className="contact-manager p-6 bg-white rounded-lg shadow-md mt-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Gestionar Lista de Correos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="import-section p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Importar desde Excel / CSV</h3>
          <p className="text-sm text-gray-600 mb-4">
            Asegúrate de que tu archivo tenga una columna llamada "email" o "correo". Opcionalmente puedes incluir "nombre" y "apellido".
          </p>
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div className="manual-section p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Añadir Manualmente</h3>
          <form onSubmit={handleManualAdd} className="space-y-3">
            <div>
              <input 
                type="email" 
                placeholder="Correo electrónico *" 
                required 
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Nombre (opcional)" 
                value={manualFirstName}
                onChange={(e) => setManualFirstName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <input 
                type="text" 
                placeholder="Apellido (opcional)" 
                value={manualLastName}
                onChange={(e) => setManualLastName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Añadir Contacto
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Contactos en la Lista ({contacts.length})</h3>
        {contacts.length === 0 ? (
          <p className="text-gray-500 italic">No hay contactos agregados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Nombre</th>
                  <th className="py-2 px-4 text-left">Apellido</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{c.email}</td>
                    <td className="py-2 px-4">{c.first_name || '-'}</td>
                    <td className="py-2 px-4">{c.last_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
