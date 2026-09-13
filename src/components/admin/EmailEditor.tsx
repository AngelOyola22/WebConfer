import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EmailEditorProps {
  initialValue?: string;
  onChange: (html: string) => void;
}

export const EmailEditor: React.FC<EmailEditorProps> = ({ initialValue = '', onChange }) => {
  const [value, setValue] = useState(initialValue);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link', 'image',
  ];

  const handleChange = (content: string) => {
    setValue(content);
    onChange(content);
  };

  return (
    <div className="email-editor-container" style={{ minHeight: '300px', backgroundColor: 'white', color: 'black' }}>
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={handleChange} 
        modules={modules}
        formats={formats}
        style={{ height: '250px' }}
      />
    </div>
  );
};
