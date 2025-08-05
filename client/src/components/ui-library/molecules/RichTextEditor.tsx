import React, { useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  toolbarOptions?: string[]; // e.g., ['bold', 'italic', 'underline']
}

/**
 * Best-in-class RichTextEditor component. Uses contenteditable for demo purposes.
 * Replace with react-quill or another library for production if desired.
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing... ',
  disabled = false,
  toolbarOptions = ['bold', 'italic', 'underline', 'ul', 'ol', 'link'],
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Configure DOMPurify to allow only safe HTML
  const purifyConfig = {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  };

  const handleInput = () => {
    if (editorRef.current) {
      // Sanitize HTML before passing to onChange
      const sanitizedHtml = DOMPurify.sanitize(editorRef.current.innerHTML, purifyConfig);
      onChange(sanitizedHtml);
    }
  };

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
    handleInput();
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 8, background: disabled ? '#f5f5f5' : '#fff' }}>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        {toolbarOptions.includes('bold') && (
          <button type="button" onClick={() => handleFormat('bold')} disabled={disabled} aria-label="Bold" style={{ fontWeight: 700 }}>B</button>
        )}
        {toolbarOptions.includes('italic') && (
          <button type="button" onClick={() => handleFormat('italic')} disabled={disabled} aria-label="Italic" style={{ fontStyle: 'italic' }}>I</button>
        )}
        {toolbarOptions.includes('underline') && (
          <button type="button" onClick={() => handleFormat('underline')} disabled={disabled} aria-label="Underline" style={{ textDecoration: 'underline' }}>U</button>
        )}
        {toolbarOptions.includes('ul') && (
          <button type="button" onClick={() => handleFormat('insertUnorderedList')} disabled={disabled} aria-label="Bullet List">• List</button>
        )}
        {toolbarOptions.includes('ol') && (
          <button type="button" onClick={() => handleFormat('insertOrderedList')} disabled={disabled} aria-label="Numbered List">1. List</button>
        )}
        {toolbarOptions.includes('link') && (
          <button type="button" onClick={() => handleFormat('createLink')} disabled={disabled} aria-label="Insert Link">🔗</button>
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        aria-label={placeholder}
        style={{
          minHeight: 120,
          outline: 'none',
          padding: 8,
          fontSize: 16,
          background: disabled ? '#f5f5f5' : '#fff',
          borderRadius: 4,
        }}
        onInput={handleInput}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value || '', purifyConfig) }}
      />
    </div>
  );
};

export default RichTextEditor; 