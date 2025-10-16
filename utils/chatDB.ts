// IndexedDB聊天记录存储工具类

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  imageData?: string;
  sessionId?: string; // 可选：用于区分不同会话
}

interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

class ChatDB {
  private dbName = 'AIChatDB';
  private dbVersion = 1;
  private storeNames = {
    messages: 'chat_messages',
    sessions: 'chat_sessions'
  };
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB打开失败:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB升级/创建数据库');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建聊天消息存储
        if (!db.objectStoreNames.contains(this.storeNames.messages)) {
          const messageStore = db.createObjectStore(this.storeNames.messages, { 
            keyPath: 'id',
            autoIncrement: false 
          });
          
          // 创建索引用于按时间排序和会话查询
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('sessionId', 'sessionId', { unique: false });
          messageStore.createIndex('type', 'type', { unique: false });
          console.log('聊天消息存储创建成功');
        }
        
        // 创建聊天会话存储
        if (!db.objectStoreNames.contains(this.storeNames.sessions)) {
          const sessionStore = db.createObjectStore(this.storeNames.sessions, { 
            keyPath: 'id',
            autoIncrement: false 
          });
          
          // 创建索引用于按时间排序
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log('聊天会话存储创建成功');
        }
      };
      
      request.onblocked = () => {
        console.warn('IndexedDB被其他标签页占用');
      };
    });
  }

  // 添加聊天消息
  async addMessage(message: Omit<ChatMessage, 'id'>, sessionId: string = 'default'): Promise<string> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeNames.messages], 'readwrite');
      const store = transaction.objectStore(this.storeNames.messages);
      
      const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fullMessage: ChatMessage = {
        ...message,
        id,
        sessionId
      };

      const request = store.add(fullMessage);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // 更新会话信息
        this.updateSession(sessionId, message.timestamp);
        resolve(id);
      };
    });
  }

  // 获取指定会话的所有消息（按时间正序）
  async getMessages(sessionId: string = 'default'): Promise<ChatMessage[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeNames.messages], 'readonly');
      const store = transaction.objectStore(this.storeNames.messages);
      const index = store.index('sessionId');
      const request = index.openCursor(IDBKeyRange.only(sessionId));

      const messages: ChatMessage[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          // 按时间正序排序
          messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          resolve(messages);
        }
      };
    });
  }

  // 获取所有会话
  async getSessions(): Promise<ChatSession[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeNames.sessions], 'readonly');
      const store = transaction.objectStore(this.storeNames.sessions);
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev'); // 按更新时间倒序

      const sessions: ChatSession[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          sessions.push(cursor.value);
          cursor.continue();
        } else {
          resolve(sessions);
        }
      };
    });
  }

  // 更新会话信息
  private async updateSession(sessionId: string, lastMessageTime: Date): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeNames.sessions], 'readwrite');
      const store = transaction.objectStore(this.storeNames.sessions);
      
      // 获取当前会话
      const getRequest = store.get(sessionId);
      
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        let session: ChatSession;
        
        if (getRequest.result) {
          // 更新现有会话
          session = {
            ...getRequest.result,
            updatedAt: lastMessageTime,
            messageCount: getRequest.result.messageCount + 1
          };
        } else {
          // 创建新会话
          session = {
            id: sessionId,
            name: sessionId === 'default' ? '默认会话' : `会话 ${sessionId}`,
            createdAt: lastMessageTime,
            updatedAt: lastMessageTime,
            messageCount: 1
          };
        }
        
        const putRequest = store.put(session);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };
    });
  }

  // 删除会话及其所有消息
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.storeNames.messages, this.storeNames.sessions], 
        'readwrite'
      );
      
      // 删除会话中的所有消息
      const messageStore = transaction.objectStore(this.storeNames.messages);
      const messageIndex = messageStore.index('sessionId');
      const messageRequest = messageIndex.openCursor(IDBKeyRange.only(sessionId));
      
      messageRequest.onerror = () => reject(messageRequest.error);
      messageRequest.onsuccess = () => {
        const cursor = messageRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // 删除会话记录
          const sessionStore = transaction.objectStore(this.storeNames.sessions);
          const sessionRequest = sessionStore.delete(sessionId);
          
          sessionRequest.onerror = () => reject(sessionRequest.error);
          sessionRequest.onsuccess = () => resolve();
        }
      };
    });
  }

  // 清空所有聊天记录
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.storeNames.messages, this.storeNames.sessions], 
        'readwrite'
      );
      
      const messageStore = transaction.objectStore(this.storeNames.messages);
      const sessionStore = transaction.objectStore(this.storeNames.sessions);
      
      const messageRequest = messageStore.clear();
      const sessionRequest = sessionStore.clear();
      
      messageRequest.onerror = () => reject(messageRequest.error);
      sessionRequest.onerror = () => reject(sessionRequest.error);
      
      transaction.oncomplete = () => resolve();
    });
  }

  // 获取消息数量
  async getMessageCount(sessionId?: string): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeNames.messages], 'readonly');
      const store = transaction.objectStore(this.storeNames.messages);
      
      let request: IDBRequest<number>;
      
      if (sessionId) {
        const index = store.index('sessionId');
        request = index.count(IDBKeyRange.only(sessionId));
      } else {
        request = store.count();
      }

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 导出聊天记录为JSON
  async exportMessages(sessionId?: string): Promise<ChatMessage[]> {
    const messages = sessionId ? await this.getMessages(sessionId) : await this.getAllMessages();
    return messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp // 保持Date对象，JSON序列化时会自动转换
    }));
  }

  // 获取所有消息（不分会话）
  private async getAllMessages(): Promise<ChatMessage[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeNames.messages], 'readonly');
      const store = transaction.objectStore(this.storeNames.messages);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result as ChatMessage[];
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        resolve(messages);
      };
    });
  }
}

// 创建单例实例
export const chatDB = new ChatDB();

// 导出类型
export type { ChatMessage, ChatSession };