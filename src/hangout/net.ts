// The live room on start.ng: everyone in the Hangout sees each other move and wave.
// The server side is startng-be app/live.py; message types are described there.
import { getLiveTicket } from "../api";
import type { DressedStyle } from "../character";
import type { ChatMessage } from "./chat";

// Close codes from the server.
const BAD_TICKET = 4401;
const ROOM_FULL = 4403;
const REPLACED = 4409;

// What the API says when no game called "hangout" has been published yet.
const NO_GAME = "No game with that name";

// x and z are null until the player first moves: they're standing at their seat.
export type Player = { id: number; name: string; style?: Partial<DressedStyle> | null; seat?: number | null; x: number | null; z: number | null; ry: number; moving: boolean };
/** Everyone who has a seat, in the room or not. */
export type Resident = { id: number; name: string; style?: Partial<DressedStyle> | null; seat: number };
export type RoomMessage =
  | { type: "welcome"; you: number; players: Player[]; seats?: Resident[]; chat?: ChatMessage[] } // chat: the room's earlier messages (older servers leave it out)
  | { type: "join"; player: Player }
  | { type: "move"; id: number; x: number; z: number; ry: number; moving: boolean }
  | { type: "wave"; id: number }
  | { type: "leave"; id: number; seat?: number | null }
  | ({ type: "chat" } & ChatMessage); // sent to everyone in the room, the sender too
export type OutgoingMessage = { type: "wave" } | { type: "chat"; text: string } | { type: "move"; x: number; z: number; ry: number; moving: boolean };

/** 'signin' means the player needs signing in, 'replaced' that they joined again from another tab, 'unavailable' that the server has no Hangout. */
type BlockedReason = "signin" | "replaced" | "unavailable";
type RoomHandlers = {
  onMessage: (msg: RoomMessage) => void;
  onReconnecting: (reason: "lost" | "full") => void;
  onBlocked: (reason: BlockedReason) => void;
};

export class LiveRoom {
  private ws: WebSocket | null = null;
  private tries = 0;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private handlers: RoomHandlers) {}

  async connect() {
    if (this.stopped) return;
    let pass: { ticket: string; url: string };
    try {
      pass = await getLiveTicket(localStorage.getItem("token"), "hangout");
    } catch (err) {
      // No connection: worth trying again. Otherwise the server said no, because the player isn't
      // signed in or there's no Hangout game on the server yet.
      if (err instanceof TypeError) return this.retry("lost");
      return this.handlers.onBlocked(err instanceof Error && err.message === NO_GAME ? "unavailable" : "signin");
    }
    if (this.stopped) return;
    const ws = new WebSocket(`${pass.url}?ticket=${encodeURIComponent(pass.ticket)}`);
    this.ws = ws;
    ws.addEventListener("message", (e) => {
      let msg: RoomMessage;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type === "welcome") this.tries = 0;
      this.handlers.onMessage(msg);
    });
    ws.addEventListener("close", (e) => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.stopped) return;
      if (e.code === REPLACED) return this.handlers.onBlocked("replaced");
      if (e.code === BAD_TICKET) return this.handlers.onBlocked("signin");
      this.retry(e.code === ROOM_FULL ? "full" : "lost");
    });
  }

  private retry(reason: "lost" | "full") {
    if (this.stopped) return;
    const delay = Math.min(15000, 1000 * 2 ** this.tries++);
    this.handlers.onReconnecting(reason);
    this.timer = setTimeout(() => this.connect(), delay);
  }

  send(msg: OutgoingMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
    this.ws?.close();
    this.ws = null;
  }

  rejoin() {
    this.stopped = false;
    this.tries = 0;
    this.connect();
  }
}
