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
        // Disable built-in marks if we are doing our own "parse on send"
        // But keep them if we want rich text natively.
        // We'll keep them standard.
        bold: false,
        italic: false,
        strike: false,
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "Type a message",
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
      // Throttle typing emits
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
          "prose dark:prose-invert prose-sm m-0 focus:outline-none max-h-[120px] overflow-y-auto custom-scrollbar px-3 py-2.5",
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
    // In a real app we might want to send the actual HTML or just the parsed text.
    // Assuming parsedHtml for this implementation.
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
    <div className="flex items-end gap-2 w-full relative">
      {/* Left Actions */}
      <div className="flex items-center gap-1 shrink-0 px-2">
        <button
          onClick={onOpenAttachments}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Paperclip size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Center Input (Tiptap) */}
      <div className="flex-1 bg-transparent transition-all overflow-hidden relative self-center">
        {/* Tiptap styles needed for placeholder: 
           .is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #9ca3af; pointer-events: none; height: 0; } 
          */}
        <style>{`
          .is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #9ca3af;
            pointer-events: none;
            height: 0;
          }
          .ProseMirror p { margin: 0; }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0 pr-1 relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Smile size={20} strokeWidth={2.5} />
        </button>

        {showEmojiPicker && (
          <div
            ref={emojiRef}
            className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-100"
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
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
            onClick={handleSend}
          >
            {isEditMode ? <Check size={20} /> : <Send size={20} />}
          </button>
        ) : (
          <button
            onMouseDown={onStartVoice}
            onTouchStart={onStartVoice}
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Mic size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
