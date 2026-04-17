import { apiRequest } from './api';
import { SharePostInput, ShareUser } from '../types/interactions';

type FetchUsersResponse = {
  users: ShareUser[];
};

type SharePostResponse = {
  success: boolean;
};

class ShareService {
  async fetchUsers(query = ''): Promise<ShareUser[]> {
    const searchParams = new URLSearchParams();
    if (query.trim().length > 0) {
      searchParams.append('query', query.trim());
    }

    const querySuffix = searchParams.toString().length > 0 ? `?${searchParams.toString()}` : '';
    const response = await apiRequest<FetchUsersResponse>(`/share/users${querySuffix}`);

    return response.users;
  }

  async sharePost(input: SharePostInput): Promise<boolean> {
    const response = await apiRequest<SharePostResponse>('/share', {
      method: 'POST',
      body: input,
    });

    return response.success;
  }
}

export default new ShareService();
