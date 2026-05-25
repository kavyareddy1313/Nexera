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
    <div className="flex flex-col w-full bg-white/40 backdrop-blur-md border-t border-white/20 z-20">
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
        <div className="pb-6 pt-4 w-full max-w-4xl mx-auto px-6 flex flex-col items-center">
          <div className="w-full bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] rounded-[2rem] border border-white/50 p-1.5 flex items-center transition-all">
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
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-300 mt-4 uppercase">PRESS SHIFT + ENTER TO SEND</p>
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
