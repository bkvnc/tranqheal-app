import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Report, ReportBody } from '../hooks/types';

export const fetchForumReports = async (forumId: string): Promise<Report[]> => {
    const reportsRef = collection(db, 'forums', forumId, 'reports');
    const reportsSnapshot = await getDocs(reportsRef);
    
    return reportsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        ...data,
        body: data.body as ReportBody,
        dateCreated: data.dateCreated?.toDate?.() ?? data.dateCreated
      } as Report;
    });
  };
  

export const fetchPostReports = async (forumId: string, postId: string): Promise<Report[]> => {
  const reportsRef = collection(db, 'forums', forumId, 'posts', postId, 'reports');
  const reportsSnapshot = await getDocs(reportsRef);
  return reportsSnapshot.docs.map(doc => doc.data() as Report);
};  

export const fetchCommentReports = async (
  forumId: string,
  postId: string,
  commentId: string
): Promise<Report[]> => {
  const reportsRef = collection(db, 'forums', forumId, 'posts', postId, 'comments', commentId, 'reports');
  const reportsSnapshot = await getDocs(reportsRef);
  return reportsSnapshot.docs.map(doc => doc.data() as Report);
};
