import { apiRequest } from './api';
import { CommentModel, CreateCommentInput } from '../types/interactions';

type GetCommentsResponse = {
  comments: CommentModel[];
};

type LikeCommentResponse = {
  comment: CommentModel;
};

class CommentService {
  async getComments(postId: string): Promise<CommentModel[]> {
    const response = await apiRequest<GetCommentsResponse>(`/feed/${postId}/comments`);
    return response.comments;
  }

  async postComment(input: CreateCommentInput): Promise<CommentModel> {
    return apiRequest<CommentModel>(`/feed/${input.postId}/comments`, {
      method: 'POST',
      body: {
        commentText: input.content,
      },
    });
  }

  async likeComment(commentId: string): Promise<CommentModel> {
    const response = await apiRequest<LikeCommentResponse>(`/feed/comments/${commentId}/likes`, {
      method: 'POST',
    });

    return response.comment;
  }
}

export default new CommentService();
