import { Platform } from 'react-native';

const API_URL = Platform.select({
  ios: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api',
  default: 'http://localhost:3000/api',
});

class FeedService {
  async getFeed(page: number = 1, limit: number = 20) {
    try {
      const response = await fetch(`${API_URL}/feed?page=${page}&limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Get feed error:', error);
      throw error;
    }
  }

  async createPost(content: string, image?: string) {
    try {
      const response = await fetch(`${API_URL}/feed/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, image }),
      });
      return await response.json();
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  async likePost(postId: string) {
    try {
      const response = await fetch(`${API_URL}/feed/posts/${postId}/like`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Like post error:', error);
      throw error;
    }
  }

  async commentOnPost(postId: string, content: string) {
    try {
      const response = await fetch(`${API_URL}/feed/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      return await response.json();
    } catch (error) {
      console.error('Comment error:', error);
      throw error;
    }
  }
}

export default new FeedService();
