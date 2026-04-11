import { Platform } from 'react-native';

const API_URL = Platform.select({
  ios: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api',
  default: 'http://localhost:3000/api',
});

class ChatService {
  async getRooms() {
    try {
      const response = await fetch(`${API_URL}/chat/rooms`);
      return await response.json();
    } catch (error) {
      console.error('Get rooms error:', error);
      throw error;
    }
  }

  async getRoomMessages(roomId: string) {
    try {
      const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`);
      return await response.json();
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  async createRoom(name: string, participants: string[]) {
    try {
      const response = await fetch(`${API_URL}/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, participants }),
      });
      return await response.json();
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  }

  async sendMessage(roomId: string, content: string, encrypted: boolean = true) {
    try {
      const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, encrypted }),
      });
      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }
}

export default new ChatService();
