export interface ReviewResponse {
  reviewer: {
    uuid: string;
    avatar: string;
    name: string;
    email: string;
  };

  friendliness: number;

  knowledge: number;

  communication: number;

  comment?: string;
}
