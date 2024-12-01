// src/types.ts
import { Timestamp } from 'firebase/firestore';


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
    reportCount: number | null;
}




export interface Report {
  id: string;
  authorName: string;
  contentType: 'Forum' | 'Post' | 'Comment';
  forumId: string;
  postId?: string;
  commentId?: string;
  reason: string;
  reportedBy: string;
  timestamp: Date;
  reportCount: number;
}


export interface ForumReport extends Report {}
export interface PostReport extends Report {}
export interface CommentReport extends Report {}


export interface Post {
    id: string;
    title: string;
    dateCreated: any;
    description: string;
    status: string;
    content: string;
    author: string; 
    authorId: string; 
    reacted: number;
    forumId: string;
    reactedBy: string[]; 
    authorName: string;
    authorType: string;
    imageUrl?: string;
}


export interface Comment {
    id: string;
    content: string;
    dateCreated: any;
    authorName: string;
    authorId: string;
    postId: string;
    commentReactions: string[];
    reports: string[];
    reactedBy?: string[];
    reacted?: number;
    replies?: Comment[]
    
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

export interface Organization {
    id: string;
    organizationId: string;
    organizationName: string;
    servicesOffered: string;
    address: string;
    email: string;
    createdAt: any;
    subscriptionPlan: string;
    timeAvailability: string[];
    timeEnd: string;
    timeStart: string;
    professionalId: string;
  }


export interface Application{
    id: string;
    organizationName: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    status: string;
    createdAt: any;
    professionalName: string;
    submissionDate: any;
    specialization: string;
    facebookLink: string;
    linkedInLink: string;
    instagramLink: string;
    twitterLink: string;
    description: string;
    profilePicture: string;
    profileImage: string;
    userId: string;
    applicantName: string;
    approvedAt: any;
    rejectedAt: any;
    professionalId: string;
    fileUrl: string;
}


export interface Notification {
    id: string;
    recipientId: string;
    recipientType: string;
    type: string; // or other fields based on your design
    message: string;
    isRead: boolean;
    createdAt: Date;
}

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: 'awaiting_payment_method' | 'processing' | 'succeeded' | 'failed';
    client_key?: string;
  }
  
  export interface CheckoutFormData {
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    name: string;
    email: string;
  }

export interface Professional {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    organizationName: string;
    userType: string;
    createdAt: any;
    lastLogin: any;
    dateApproved: any;
    status: string;
}

export interface Subscription {
    id: string;
    organizationId: string;
    planType: 'annual' | 'semi-annual';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled';
    amount: number;
    createdAt: Date;
  }


  export interface Plan {
    id: 'annual' | 'semi-annual';
    name: string;
    price: number;
    description: string;
    benefits: string[];
    billingCycle: number;
    startDate: Date;
    endDate: Date;
  }

 

  export interface SourceCreateParams {
    type: 'gcash' | 'maya';
    amount: number;
    currency: string;
    redirect: {
      success: string;
      failed: string;
    };
    billing: {
      name: string;
      email: string;
      phone: string;
    };
  }


  export type PaymentIntentStatus = 'awaiting_payment_method' | 'processing' | 'succeeded' | 'failed';

export interface PaymentMethodOptions {
  card: {
    request_three_d_secure: 'automatic' | 'any' | 'never';
  };
}

export interface PaymentIntentAttributes {
  amount: number;
  currency: string;
  payment_method_allowed: string[];
  payment_method_options: PaymentMethodOptions;
  status?: PaymentIntentStatus;
  client_key?: string;
  last_payment_error?: {
    message: string;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  attributes: {
    billing: {
      address: {
        city: string;
        country: string;
        line1: string;
        line2?: string;
        postal_code: string;
        state: string;
      };
      email: string;
      name: string;
      phone: string;
    };
    details: {
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  };
}

export interface PaymentIntent {
  id: string;
  type: 'payment_intent';
  attributes: PaymentIntentAttributes;
}

export interface PaymongoError {
  errors: Array<{
    code: string;
    detail: string;
  }>;
}
