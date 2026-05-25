import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

export const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length,
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[200px]">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
              index === selectedIndex
                ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100"
                : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 overflow-hidden shrink-0">
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold">
                  {item.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="truncate">{item.name}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500 text-center">
          No users found
        </div>
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";
