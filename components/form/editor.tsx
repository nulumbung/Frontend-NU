
'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { api } from '@/components/auth/auth-context';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Redo, 
  Strikethrough, 
  Undo, 
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getUploadErrorMessage = (error: unknown) => {
  const validationMessage = (error as { response?: { data?: { errors?: { file?: string[] } } } }).response?.data?.errors?.file?.[0];
  if (typeof validationMessage === 'string' && validationMessage.trim()) return validationMessage;

  const responseMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;

  return error instanceof Error ? error.message : 'Upload gambar gagal.';
};

const MenuBar = ({ editor }: { editor: TiptapEditor | null }) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!editor) {
    return null;
  }

  const askImageMeta = () => {
    const captionPrompt = window.prompt('Keterangan Gambar (Caption) - opsional:', '') ?? '';
    const creditPrompt = window.prompt('Kredit Gambar - opsional:', '') ?? '';

    return {
      caption: captionPrompt.trim(),
      credit: creditPrompt.trim(),
    };
  };

  const insertImageWithMeta = (imageSrc: string, fallbackAlt = 'Gambar berita') => {
    const { caption, credit } = askImageMeta();
    const alt = caption || fallbackAlt;

    editor.chain().focus().setImage({ src: imageSrc, alt }).run();

    if (caption) {
      editor
        .chain()
        .focus()
        .insertContent(`<p><em>Keterangan Gambar: ${escapeHtml(caption)}</em></p>`)
        .run();
    }

    if (credit) {
      editor
        .chain()
        .focus()
        .insertContent(`<p><em>Kredit Gambar: ${escapeHtml(credit)}</em></p>`)
        .run();
    }
  };

  const addImageFromUrl = () => {
    const rawUrl = window.prompt('URL Gambar:');
    const url = (rawUrl || '').trim();

    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      alert('URL gambar harus diawali http:// atau https://');
      return;
    }

    insertImageWithMeta(url, 'Gambar berita');
  };

  const addImageFromUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert(`Ukuran gambar maksimal ${MAX_IMAGE_SIZE_MB}MB.`);
      event.target.value = '';
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload', formData);
      const imageUrl = response.data?.url;

      if (!imageUrl) {
        alert('URL gambar tidak ditemukan setelah upload.');
        return;
      }

      insertImageWithMeta(imageUrl, file.name || 'Gambar berita');
    } catch (error) {
      alert(`Gagal upload gambar: ${getUploadErrorMessage(error)}`);
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={setLink}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('link') ? 'bg-gray-200 text-black' : 'text-gray-600'}`}
        title="Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={addImageFromUrl}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
        title="Sisipkan gambar (URL + caption + kredit)"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => imageFileInputRef.current?.click()}
        disabled={isUploadingImage}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-40"
        title="Upload gambar (caption + kredit)"
      >
        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      </button>
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        onChange={addImageFromUpload}
        className="hidden"
      />

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-30"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-30"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Editor = ({ value, onChange, className = '' }: EditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
