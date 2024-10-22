// src/types.ts
export interface Forum {
    id: string;
    title: string;
    dateCreated: any;
    totalMembers: number | null;
    totalComments: number | null;
    tags: string[];
    status: string;
    description: string;
    authorName: string;
    authorType: string;
    authorId: string;
    members: string[];
}

export interface Post {
    id: string;
    content: string;
    dateCreated: any;
    author: string; 
    authorId: string; 
    reacts: number;
    forumId: string;
    userReactions: string[]; 
}


export interface Comment {
    id: string;
    content: string;
    dateCreated: any;
    author: string;
    authorId: string;
    postId: string;
    userReactions: string[];
    reports: number;
}