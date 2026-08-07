export function generateMockMessages(count) {
  const messages = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    // Generate dates going back in time
    const msgDate = new Date(now.getTime() - (count - i) * 3600000 * 2);
    const id = `msg_${i}`;
    const isOwn = i % 3 === 0;

    if (i === count - 1) {
      messages.push({
        id,
        type: "TEXT",
        senderId: "u1",
        isOwn: true,
        timestamp: msgDate.toISOString(),
        status: "read",
        content: "Check out this design https://dribbble.com/shots/123",
        reactions: [{ emoji: "🔥", count: 2, users: ["u2"] }],
      });
      continue;
    }

    if (i === count - 2) {
      messages.push({
        id,
        type: "IMAGE",
        senderId: "u2",
        isOwn: false,
        sender: { id: "u2", name: "Priya Sharma", color: "#e11d48" },
        timestamp: msgDate.toISOString(),
        mediaUrl:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
        caption: "Looks great! Here is another variant.",
      });
      continue;
    }

    if (i === count - 3) {
      messages.push({
        id,
        type: "VOICE",
        senderId: "u1",
        isOwn: true,
        timestamp: msgDate.toISOString(),
        status: "read",
        audioUrl: "#",
        duration: 15,
        peaks: Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2),
      });
      continue;
    }

    if (i === count - 4) {
      messages.push({
        id,
        type: "REPLY",
        senderId: "u2",
        isOwn: false,
        sender: { id: "u2", name: "Priya Sharma", color: "#e11d48" },
        timestamp: msgDate.toISOString(),
        content: "I completely agree with this approach.",
        replyTo: {
          messageId: "msg_old",
          senderName: "You",
          content: "I think we should use React Query for infinite scrolling.",
        },
      });
      continue;
    }

    if (i === count - 5) {
      messages.push({
        id,
        type: "SYSTEM",
        senderId: "sys",
        isOwn: false,
        timestamp: msgDate.toISOString(),
        content:
          "Messages to this chat and calls are now secured with end-to-end encryption.",
      });
      continue;
    }
    if (i === count - 6) {
      messages.push({
        id,
        type: "DOCUMENT",
        senderId: "u3",
        isOwn: false,
        sender: { id: "u3", name: "Alex", color: "#16a34a" },
        timestamp: msgDate.toISOString(),
        fileUrl: "#",
        fileName: "Q3_Report_Final.pdf",
        fileSize: 2048576,
        mimeType: "application/pdf",
      });
      continue;
    }

    // Default TEXT
    messages.push({
      id,
      type: "TEXT",
      senderId: isOwn ? "u1" : "u2",
      isOwn,
      sender: isOwn
        ? undefined
        : { id: "u2", name: "Priya Sharma", color: "#e11d48" },
      timestamp: msgDate.toISOString(),
      status: isOwn ? "read" : undefined,
      content: `This is a randomly generated message number ${i}. Let's see how it looks.`,
    });
  }

  return messages;
}
