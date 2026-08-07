import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { MentionList } from "./MentionList";

// Mock users for mention
const MOCK_USERS = [
  {
    id: "u1",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/150?u=priya",
  },
  { id: "u2", name: "Arjun Gupta" },
  {
    id: "u3",
    name: "Rahul Desai",
    avatar: "https://i.pravatar.cc/150?u=rahul",
  },
  { id: "u4", name: "Neha Patel" },
];

export const mentionSuggestion = {
  items: ({ query }) => {
    return MOCK_USERS.filter((item) =>
      item.name.toLowerCase().startsWith(query.toLowerCase()),
    ).slice(0, 5);
  },
  render: () => {
    let component;
    let popup;

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "top-start",
        });
      },
      onUpdate(props) {
        component.updateProps(props);
        if (!props.clientRect) return;
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },
      onKeyDown(props) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },
      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
