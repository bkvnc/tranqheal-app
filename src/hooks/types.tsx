// src/types.ts


export interface Forum {
    id: string;
    title: string;
    dateCreated: any;
    totalMembers: number | null;
    totalComments: number | null;
    totalPosts: number | null;
    tags: string[];
    status: string;
    description: string;
    authorName: string;
    authorType: string;
    authorId: string;
    members: string[];
    reports: number | null;
}

export interface Post {
    id: string;
    title: string;
    dateCreated: any;
    description: string;
    status: string;
    content: string;
    author: string; 
    authorId: string; 
    reacts: number;
    forumId: string;
    userReactions: string[]; 
    authorName: string;
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


export interface UserData {
    userType: string;
    organizationName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    profileImage?: string;
}