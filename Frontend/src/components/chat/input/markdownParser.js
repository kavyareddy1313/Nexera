export function parseWhatsAppMarkdown(text) {
  if (!text) return text;
  let html = text;
  // Parse ```code``` block
  // Uses a non-greedy match to replace ```content``` with <pre><code>content</code></pre>
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm font-mono overflow-x-auto"><code>$1</code></pre>',
  );
  // Parse *bold*
  html = html.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  // Parse _italic_
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");
  // Parse ~strikethrough~
  html = html.replace(/~(.*?)~/g, "<del>$1</del>");

  // The output of this will be sent as the 'content' of the message,
  // which might need to be rendered using `dangerouslySetInnerHTML` in the MessageBubble,
  // or we just send it as text and parse it on the rendering side.
  // The prompt says "parse on send", so we'll do it here.
  return html;
}
