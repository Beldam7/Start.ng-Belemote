// The chat sidebar and the "say something" box. Messages come from the live room (see net.ts):
// everyone's arrive on the left and yours on the right, like any chat app.
// Text is always put on the page as text, never as HTML.
export type ChatMessage = { id: number; name: string; text: string; at: number };

export const MAX_CHAT = 200; // keep in step with MAX_CHAT in startng-be app/live.py
const KEEP = 200; // messages kept on the page

export type Chat = {
  isOpen: () => boolean;
  /** Puts the cursor in whichever box is showing, so Enter starts a message. */
  focusInput: () => void;
  /** Who "you" are, so your messages go on the right. */
  setSelf: (id: number | null) => void;
  /** Turns the boxes on once you're in the room and off when you're not. */
  setEnabled: (on: boolean) => void;
  /** Replaces everything with the room's earlier messages. */
  reset: (history: ChatMessage[]) => void;
  add: (message: ChatMessage) => void;
  dispose: () => void;
};

export function createChat(root: HTMLElement, onSend: (text: string) => void, onToggle: (open: boolean) => void): Chat {
  const find = <T extends HTMLElement>(selector: string) => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`The chat is missing ${selector}`);
    return el;
  };
  const panel = find(".hangout-chat");
  const list = find(".hangout-chat-list");
  const empty = find(".hangout-chat-empty");
  const toggle = find<HTMLButtonElement>(".hangout-chat-toggle");
  const badge = find(".hangout-chat-badge");
  const closeButton = find<HTMLButtonElement>(".hangout-chat-close");
  const forms = [find<HTMLFormElement>(".hangout-say"), find<HTMLFormElement>(".hangout-chat-form")];

  const listeners: [EventTarget, string, EventListener][] = [];
  const listen = <E extends Event>(target: EventTarget, type: string, fn: (e: E) => void) => {
    target.addEventListener(type, fn as EventListener);
    listeners.push([target, type, fn as EventListener]);
  };

  let selfId: number | null = null;
  let open = false;
  let unread = 0;

  const inputOf = (form: HTMLFormElement) => form.querySelector("input")!;
  const buttonOf = (form: HTMLFormElement) => form.querySelector("button")!;

  function showUnread() {
    badge.textContent = unread > 9 ? "9+" : String(unread);
    badge.hidden = unread === 0;
  }

  function setOpen(next: boolean) {
    open = next;
    root.classList.toggle("chat-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    if (open) {
      unread = 0;
      showUnread();
      list.scrollTop = list.scrollHeight;
      inputOf(forms[1]).focus();
    } else {
      inputOf(forms[1]).blur();
    }
    onToggle(open);
  }

  const timeOf = (at: number) => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  function row(message: ChatMessage) {
    const mine = message.id === selfId;
    const li = document.createElement("li");
    li.className = mine ? "hangout-msg mine" : "hangout-msg";
    if (!mine) {
      const who = document.createElement("span");
      who.className = "who";
      who.textContent = message.name;
      li.append(who);
    }
    const text = document.createElement("p");
    text.textContent = message.text;
    const time = document.createElement("time");
    time.textContent = timeOf(message.at);
    time.dateTime = new Date(message.at).toISOString();
    li.append(text, time);
    return li;
  }

  function trim() {
    while (list.children.length > KEEP) list.firstElementChild?.remove();
    empty.hidden = list.children.length > 0;
  }

  listen(toggle, "click", () => setOpen(!open));
  listen(closeButton, "click", () => setOpen(false));
  for (const form of forms) {
    const input = inputOf(form);
    input.maxLength = MAX_CHAT;
    listen<SubmitEvent>(form, "submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      onSend(text);
      input.value = "";
      if (form === forms[0]) input.blur(); // back to walking; the sidebar keeps the cursor for a conversation
    });
    listen<KeyboardEvent>(input, "keydown", (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (form === forms[1]) setOpen(false);
      else input.blur();
    });
  }

  return {
    isOpen: () => open,
    focusInput: () => {
      const input = inputOf(open ? forms[1] : forms[0]);
      if (!input.disabled) input.focus();
    },
    setSelf: (id) => {
      selfId = id;
    },
    setEnabled: (on) => {
      for (const form of forms) {
        inputOf(form).disabled = !on;
        buttonOf(form).disabled = !on;
      }
      root.classList.toggle("chat-ready", on);
    },
    reset: (history) => {
      list.replaceChildren(...history.map(row));
      unread = 0;
      showUnread();
      trim();
      list.scrollTop = list.scrollHeight;
    },
    add: (message) => {
      const stuck = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
      const mine = message.id === selfId;
      list.append(row(message));
      trim();
      if (stuck || mine) list.scrollTop = list.scrollHeight;
      if (!open && !mine) {
        unread += 1;
        showUnread();
      }
    },
    dispose: () => {
      for (const [target, type, fn] of listeners) target.removeEventListener(type, fn);
      root.classList.remove("chat-open", "chat-ready");
    },
  };
}
