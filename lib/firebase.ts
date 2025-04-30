// src/lib/firebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Area, Resource, Project, Task, Loop } from './types'; // lib/types.ts에서 타입 import

const firebaseConfig = {
  apiKey: "AIzaSyCKEG-VqAZRGyEpSsPIxeJV5ACZ8mfQvPY",
  authDomain: "monthlygrow-cb74d.firebaseapp.com",
  projectId: "monthlygrow-cb74d",
  storageBucket: "monthlygrow-cb74d.firebasestorage.app",
  messagingSenderId: "960277815712",
  appId: "1:960277815712:web:38f547540231380e0fc4c5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// --- Basic Data Fetching Functions ---

// Areas
export const fetchAllAreasByUserId = async (userId: string): Promise<Area[]> => {
  const q = query(collection(db, 'areas'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Area[];
};

export const fetchActiveAreasByUserId = async (userId: string): Promise<Area[]> => {
  const q = query(collection(db, 'areas'), where('userId', '==', userId), where('status', '==', 'active'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Area[];
};

export const fetchArchivedAreasByUserId = async (userId: string): Promise<Area[]> => {
  const q = query(collection(db, 'areas'), where('userId', '==', userId), where('status', '==', 'archived'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Area[];
};

export const fetchAreaById = async (areaId: string): Promise<Area> => {
    const docRef = doc(db, 'areas', areaId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Area;
    } else {
        throw new Error('Area not found');
    }
};

// Resources
export const fetchAllResourcesByUserId = async (userId: string): Promise<Resource[]> => {
  const q = query(collection(db, 'resources'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Resource[];
};

export const fetchActiveResourcesByUserId = async (userId: string): Promise<Resource[]> => {
  const q = query(collection(db, 'resources'), where('userId', '==', userId), where('status', '==', 'active'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Resource[];
};

export const fetchArchivedResourcesByUserId = async (userId: string): Promise<Resource[]> => {
  const q = query(collection(db, 'resources'), where('userId', '==', userId), where('status', '==', 'archived'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Resource[];
};

export const fetchResourceById = async (resourceId: string): Promise<Resource> => {
    const docRef = doc(db, 'resources', resourceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Resource;
    } else {
        throw new Error('Resource not found');
    }
};

// Projects
export const fetchAllProjectsByUserId = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Project[];
};

export const fetchActiveProjectsByUserId = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, 'projects'), where('userId', '==', userId), where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Project[];
};

export const fetchArchivedProjectsByUserId = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, 'projects'), where('userId', '==', userId), where('status', '==', 'archived'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Project[];
};

export const fetchProjectById = async (projectId: string): Promise<Project> => {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Project;
    } else {
        throw new Error('Project not found');
    }
};

export const fetchProjectsByAreaId = async (areaId: string): Promise<Project[]> => {
    const q = query(collection(db, 'projects'), where('areaId', '==', areaId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Project[];
};

export const fetchProjectsByLoopId = async (loopId: string): Promise<Project[]> => {
    const loop = await fetchLoopById(loopId);
    if (!loop || !loop.projectIds) {
        return [];
    }
    const projectsPromises = loop.projectIds.map((projectId: string) => fetchProjectById(projectId));
    const projects = await Promise.all(projectsPromises);
    return projects;
};

// Tasks
export const fetchAllTasksByUserId = async (userId: string): Promise<Task[]> => {
  const q = query(collection(db, 'tasks'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const fetchAllTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Task[];
};

export const fetchTaskById = async (taskId: string): Promise<Task> => {
    const docRef = doc(db, 'tasks', taskId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Task;
    } else {
        throw new Error('Task not found');
    }
};

// Loops
export const fetchAllLoopsByUserId = async (userId: string): Promise<Loop[]> => {
  const q = query(collection(db, 'loops'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      status: data.status,
      focusAreas: data.focusAreas,
      projectIds: data.projectIds,
      createdAt: data.createdAt.toDate(),
      areas: data.areas,
      doneCount: data.doneCount,
      targetCount: data.targetCount,
      reward: data.reward,
      completed: data.completed,
      reflection: data.reflection,
    } as Loop;
  });
};


export const fetchLoopById = async (loopId: string): Promise<Loop> => {
    const docRef = doc(db, 'loops', loopId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Loop;
    } else {
        throw new Error('Loop not found');
    }
};

//Archive
export const fetchArchivedItemsByUserId = async (userId: string): Promise<any> => {
  // TODO: implement fetchArchive
  return {}
}
