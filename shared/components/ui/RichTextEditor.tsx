import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

function cx(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Markdown → HTML para carregar conteúdo salvo no banco
function mdToHtml(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    if (/^### (.+)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h3>${line.replace(/^### /, '')}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h2>${line.replace(/^## /, '')}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h1>${line.replace(/^# /, '')}</h1>`);
    } else if (/^- (.+)/.test(line)) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul>'); inUl = true; }
      result.push(`<li>${line.replace(/^- /, '')}</li>`);
    } else if (/^\d+\. (.+)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol>'); inOl = true; }
      result.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
    } else if (/^> (.+)/.test(line)) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<blockquote><p>${line.replace(/^> /, '')}</p></blockquote>`);
    } else if (line.trim() === '') {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
    } else {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<s>$1</s>');
      result.push(`<p>${formatted}</p>`);
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('');
}

// HTML → Markdown para salvar no banco
function htmlToMd(html: string): string {
  return html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/gi, '> $1\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<\/ul>|<\/ol>|<ul>|<ol>/gi, '')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Comece a escrever...',
  editable = true,
  className,
}) => {
  const loaded = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none',
      }),
    ],
    content: '',
    editable,
    editorProps: {
      attributes: {
        class: cx(
          'prose prose-stone max-w-none focus:outline-none min-h-[150px] font-serif leading-loose text-lg text-foreground',
          'prose-headings:font-sans prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:my-2',
          'prose-ul:list-disc prose-ol:list-decimal',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(htmlToMd(editor.getHTML()));
    },
  });

  // Carrega o conteúdo do banco UMA única vez
  useEffect(() => {
    if (!editor || loaded.current || !content) return;
    editor.commands.setContent(mdToHtml(content));
    loaded.current = true;
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="relative w-full h-full">
      {editable && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 bg-stone-900 text-stone-100 p-1 rounded-lg shadow-xl border border-stone-700"
        >
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={cx('p-1.5 rounded hover:bg-stone-700', editor.isActive('bold') && 'bg-stone-700')}>
            <Bold size={14} />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cx('p-1.5 rounded hover:bg-stone-700', editor.isActive('italic') && 'bg-stone-700')}>
            <Italic size={14} />
          </button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={cx('p-1.5 rounded hover:bg-stone-700', editor.isActive('strike') && 'bg-stone-700')}>
            <Strikethrough size={14} />
          </button>
          <div className="w-px h-4 bg-stone-700 mx-1" />
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cx('p-1.5 rounded hover:bg-stone-700', editor.isActive('heading', { level: 1 }) && 'bg-stone-700')}>
            <Heading1 size={14} />
          </button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cx('p-1.5 rounded hover:bg-stone-700', editor.isActive('heading', { level: 2 }) && 'bg-stone-700')}>
            <Heading2 size={14} />
          </button>
          <div className="w-px h-4 bg-stone-700 mx-1" />
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={cx('p-1.5 rounded hover:bg-stone-700', editor.isActive('bulletList') && 'bg-stone-700')}>
            <List size={14} />
          </button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cx('p-1.5 rounded hover:bg-stone-700', editor.isActive('orderedList') && 'bg-stone-700')}>
            <ListOrdered size={14} />
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};

export default RichTextEditor;