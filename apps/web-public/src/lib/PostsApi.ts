import { apiGet, apiPost, apiDelete } from "./api";
import {
  PostResponse,
  PostListResponse,
  PostCreateRequest,
  ButtonClickResponse,
} from "./types";
import { FE_TO_BE } from "../PostsList"; 
export const PostsApi = {
  // 📌 글 목록 조회
  getPosts: async (params: {
    emotion?: string;
    page?: number;
    size?: number;
  }): Promise<PostListResponse> => {
    const { emotion, page = 0, size = 20 } = params;

    const query = new URLSearchParams();

if (emotion) {
  const beEmotion = FE_TO_BE[emotion.toLowerCase()] || emotion;
  query.append("emotion", beEmotion);
}

    query.append("page", page.toString());
    query.append("size", size.toString());

    return apiGet(`/posts?${query.toString()}`);
  },

  // 📌 글 단일 조회
  getPost: async (id: number): Promise<PostResponse> => {
    return apiGet(`/posts/${id}`);
  },

  // 📌 글 작성
  createPost: async (req: PostCreateRequest): Promise<PostResponse> => {
    return apiPost(`/posts`, req);
  },

  // 📌 글 삭제
  deletePost: async (id: number): Promise<void> => {
    await apiDelete(`/posts/${id}`);
  },
  // 📌 신고하기
reportPost: async (postId: number): Promise<void> => {
  await apiPost(`/posts/${postId}/report`);
},


  // 📌 버튼 클릭
  clickButton: async (
    postId: number,
    buttonType: string
  ): Promise<ButtonClickResponse> => {
    return apiPost(`/posts/${postId}/buttons/${buttonType}`);
  },
};

