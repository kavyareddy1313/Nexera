import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import { Smile, Paperclip, Mic, Send, Check } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { mentionSuggestion } from "./mentionSuggestion";
import { parseWhatsAppMarkdown } from "./markdownParser";

export function TextInput({
  initialContent,
  onSend,
  onTyping,
  onOpenAttachments,
  onStartVoice,
  isEditMode,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "Type a message...",
        emptyEditorClass: "is-editor-empty",
      }),
      Mention.configure({
        HTMLAttributes: {
          class:
            "mention bg-indigo-100 text-indigo-700 px-1 rounded font-medium",
        },
        suggestion: mentionSuggestion,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (!emojiRef.current?.dataset.typingTimeout) {
        onTyping();
        emojiRef.current = emojiRef.current || document.createElement("div");
        emojiRef.current.dataset.typingTimeout = "true";
        setTimeout(() => {
          if (emojiRef.current) delete emojiRef.current.dataset.typingTimeout;
        }, 1500);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm m-0 focus:outline-none max-h-[120px] overflow-y-auto custom-scrollbar px-2 py-1.5 text-slate-900",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleSend();
          return true;
        }
        return false;
      },
    },
  });

  // Sync initial content for edit mode
  useEffect(() => {
    if (editor && initialContent !== editor.getText()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  // Click outside for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!editor || editor.isEmpty) return;
    const rawText = editor.getText();
    const parsedHtml = parseWhatsAppMarkdown(rawText);
    onSend(parsedHtml);
    editor.commands.clearContent();
  };

  const handleEmojiSelect = (emoji) => {
    if (editor) {
      editor.commands.insertContent(emoji.native);
    }
  };

  const hasContent = editor && !editor.isEmpty;

  return (
    <div className="flex items-center gap-1.5 w-full relative">
      {/* Left Action: Attachment */}
      <button
        onClick={onOpenAttachments}
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors shrink-0"
        title="Attach files or media"
      >
        <Paperclip size={18} />
      </button>

      {/* Center Input (Tiptap) */}
      <div className="flex-1 bg-transparent transition-all overflow-hidden relative self-center">
        <style>{`
          .is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #94a3b8;
            pointer-events: none;
            height: 0;
          }
          .ProseMirror p { margin: 0; }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 shrink-0 relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
          title="Insert emoji"
        >
          <Smile size={18} />
        </button>

        {showEmojiPicker && (
          <div
            ref={emojiRef}
            className="absolute bottom-full right-0 mb-3 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200"
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        )}

        {hasContent || isEditMode ? (
          <button
            className="p-2 bg-[#5840D8] text-white rounded-xl hover:bg-[#4830c0] shadow-xs active:scale-95 transition-all"
            onClick={handleSend}
            title="Send message"
          >
            {isEditMode ? <Check size={16} strokeWidth={2.5} /> : <Send size={16} strokeWidth={2.5} />}
          </button>
        ) : (
          <button
            onMouseDown={onStartVoice}
            onTouchStart={onStartVoice}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
            title="Hold to record voice message"
          >
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
