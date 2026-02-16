
import React, { useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { cn } from '../../../lib/utils'; // Assumindo que você tem um utilitário cn, se não, use clsx/tailwind-merge direto ou crie um simples

// Fallback simples para cn se não existir
function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
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
  className
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown, // Permite entrada/saída em Markdown
      Typography,
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none',
      }),
    ],
    content: content, // Hidratação inicial
    editable: editable,
    editorProps: {
      attributes: {
        class: classNames(
          'prose prose-stone max-w-none focus:outline-none min-h-[150px] font-serif leading-loose text-lg text-foreground', // Estética de escrita premium
          'prose-headings:font-sans prose-headings:font-bold prose-headings:text-foreground',
          'prose-p:my-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-secondary prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic',
          'prose-ul:list-disc prose-ol:list-decimal',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Extrai o conteúdo como Markdown para salvar no banco
      const markdownOutput = editor.storage.markdown.getMarkdown();
      onChange(markdownOutput);
    },
  });

  // Atualiza o conteúdo se a prop mudar externamente (ex: carregamento assíncrono ou troca de documento)
  useEffect(() => {
    if (editor && content !== editor.storage.markdown.getMarkdown()) {
      // Verifica se o editor está focado para evitar pular o cursor enquanto digita
      if (!editor.isFocused) {
         editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full h-full group">
      {/* MENU FLUTUANTE (Bubble Menu) - Aparece ao selecionar texto */}
      {editable && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }} 
          className="flex items-center gap-1 bg-stone-900 text-stone-100 p-1 rounded-lg shadow-xl border border-stone-700 overflow-hidden"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={classNames("p-1.5 rounded hover:bg-stone-700 transition-colors", editor.isActive('bold') && "bg-stone-700 text-white")}
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={classNames("p-1.5 rounded hover:bg-stone-700 transition-colors", editor.isActive('italic') && "bg-stone-700 text-white")}
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={classNames("p-1.5 rounded hover:bg-stone-700 transition-colors", editor.isActive('strike') && "bg-stone-700 text-white")}
          >
            <Strikethrough size={14} />
          </button>
          
          <div className="w-px h-4 bg-stone-700 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={classNames("p-1.5 rounded hover:bg-stone-700 transition-colors", editor.isActive('heading', { level: 1 }) && "bg-stone-700 text-white")}
          >
            <Heading1 size={14} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={classNames("p-1.5 rounded hover:bg-stone-700 transition-colors", editor.isActive('heading', { level: 2 }) && "bg-stone-700 text-white")}
          >
            <Heading2 size={14} />
          </button>

          <div className="w-px h-4 bg-stone-700 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={classNames("p-1.5 rounded hover:bg-stone-700 transition-colors", editor.isActive('bulletList') && "bg-stone-700 text-white")}
          >
            <List size={14} />
          </button>
           <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={classNames("p-1.5 rounded hover:bg-stone-700 transition-colors", editor.isActive('orderedList') && "bg-stone-700 text-white")}
          >
            <ListOrdered size={14} />
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};

export default RichTextEditor;
