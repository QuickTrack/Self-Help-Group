type EventCallback = (data: any) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event: string, data: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const groupEvents = new EventEmitter();

export function invalidateGroupCache(groupId?: string) {
  groupEvents.emit('group:updated', { groupId, timestamp: Date.now() });
}

export function notifyGroupCreated(group: any) {
  groupEvents.emit('group:created', { group, timestamp: Date.now() });
}

export function notifyGroupUpdated(group: any) {
  groupEvents.emit('group:updated', { group, timestamp: Date.now() });
}

export function notifyGroupDeleted(groupId: string) {
  groupEvents.emit('group:deleted', { groupId, timestamp: Date.now() });
}