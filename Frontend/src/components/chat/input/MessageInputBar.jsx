import React, { useState, useEffect } from "react";
import { TextInput } from "./TextInput";
import { AttachmentSheet } from "./AttachmentSheet";
import { VoiceRecorder } from "./VoiceRecorder";
import { MediaPreview } from "./MediaPreview";
import { ReplyBanner } from "./ReplyBanner";

export function MessageInputBar({
  onSendMessage,
  onEditMessage,
  replyToMessage,
  editMessage,
  onCancelReplyOrEdit,
  emitTyping,
}) {
  // -- State --
  const [inputState, setInputState] = useState("TEXT");
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Sync state with props
  useEffect(() => {
    if (editMessage) {
      setInputState("EDIT");
    } else if (replyToMessage) {
      setInputState("REPLY");
    } else if (mediaItems.length > 0) {
      setInputState("MEDIA_PREVIEW");
    } else if (isVoiceRecording) {
      setInputState("VOICE");
    } else {
      setInputState("TEXT");
    }
  }, [replyToMessage, editMessage, mediaItems.length, isVoiceRecording]);

  // -- Handlers --
  const handleSendText = (content) => {
    if (inputState === "EDIT" && editMessage) {
      onEditMessage(editMessage.id, content);
      onCancelReplyOrEdit();
    } else {
      onSendMessage(content, inputState === "REPLY" ? "REPLY" : "TEXT", {
        replyTo: replyToMessage,
      });
      if (inputState === "REPLY") onCancelReplyOrEdit();
    }
  };

  const handleStartVoice = () => {
    setIsVoiceRecording(true);
  };

  const handleStopVoice = (blob, duration, peaks) => {
    setIsVoiceRecording(false);
    if (blob) {
      onSendMessage("Voice message", "VOICE", { blob, duration, peaks });
    }
  };

  const handleMediaSelect = (items) => {
    setMediaItems(items);
    setIsAttachmentSheetOpen(false);
  };

  const handleSendMedia = (items) => {
    onSendMessage("Media", "MEDIA", { items });
    setMediaItems([]);
  };

  const handleCancelMedia = () => {
    setMediaItems([]);
  };

  return (
    <div className="flex flex-col w-full bg-white border-t border-slate-200/80 z-20">
      {/* 1. Reply / Edit Banner */}
      {(inputState === "REPLY" || inputState === "EDIT") && (
        <ReplyBanner
          mode={inputState}
          message={inputState === "REPLY" ? replyToMessage : editMessage}
          onClose={onCancelReplyOrEdit}
        />
      )}

      {/* 2. Media Preview State */}
      {inputState === "MEDIA_PREVIEW" && (
        <MediaPreview
          items={mediaItems}
          onSend={handleSendMedia}
          onCancel={handleCancelMedia}
        />
      )}

      {/* 3. Voice Recording State */}
      {inputState === "VOICE" && (
        <VoiceRecorder
          onComplete={handleStopVoice}
          onCancel={() => setIsVoiceRecording(false)}
        />
      )}

      {/* 4. Text Input State (Default, Reply, Edit) */}
      {(inputState === "TEXT" ||
        inputState === "REPLY" ||
        inputState === "EDIT") && (
        <div className="py-3 px-4 sm:px-6 w-full max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-full bg-[#F8FAFC] rounded-2xl border border-slate-200/90 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/15 px-3 py-1.5 flex items-center transition-all shadow-xs">
            <TextInput
              initialContent={
                inputState === "EDIT" && editMessage?.type === "TEXT"
                  ? editMessage.content
                  : ""
              }
              onSend={handleSendText}
              onTyping={emitTyping}
              onOpenAttachments={() => setIsAttachmentSheetOpen(true)}
              onStartVoice={handleStartVoice}
              isEditMode={inputState === "EDIT"}
            />
          </div>
        </div>
      )}

      {/* 5. Attachment Sheet Overlay */}
      <AttachmentSheet
        isOpen={isAttachmentSheetOpen}
        onClose={() => setIsAttachmentSheetOpen(false)}
        onMediaSelect={handleMediaSelect}
      />
    </div>
  );
}
