import { LoopDocument } from "./types";

import {
  getFirestore,
  collection,
  query, where, orderBy, getDocs, doc, getDoc, Firestore, DocumentData, DocumentReference, QuerySnapshot, CollectionReference, DocumentSnapshot
} from "firebase/firestore";

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCKEG-VqAZRGyEpSsPIxeJV5ACZ8mfQvPY",
  authDomain: "monthlygrow-cb74d.firebaseapp.com",
  projectId: "monthlygrow-cb74d",
  storageBucket: "monthlygrow-cb74d.firebasestorage.app",
  messagingSenderId: "960277815712",
  appId: "1:960277815712:web:38f547540231380e0fc4c5",
  measurementId: "G-KP0GNXTVDD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Helper function to extract data from QuerySnapshot
const extractDataFromQuerySnapshot = <T>(querySnapshot: QuerySnapshot<DocumentData>): T[] => {
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

// Areas & Resources
const fetchAllAreasByUserId = async (db: Firestore, userId: string) => {
  const areasCollection = collection(db, "areas");
  const q = query(
    areasCollection,
    where("userId", "==", userId),
    where("type", "==", "area"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchActiveAreasByUserId = async (db: Firestore, userId: string) => {
  const areasCollection = collection(db, "areas");
  const q = query(
    areasCollection,
    where("userId", "==", userId),
    where("type", "==", "area"),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchArchivedAreasByUserId = async (db: Firestore, userId: string) => {
  const areasCollection = collection(db, "areas");
  const q = query(
    areasCollection,
    where("userId", "==", userId),
    where("type", "==", "area"),
    where("status", "==", "archived"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchAreaById = async (db: Firestore, areaId: string) => {
  const docRef = doc(db, "areas", areaId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data()?.type === "area") {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

const fetchAllResourcesByUserId = async (db: Firestore, userId: string) => {
  const areasCollection = collection(db, "areas");
  const q = query(
    areasCollection,
    where("userId", "==", userId),
    where("type", "==", "resource"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchActiveResourcesByUserId = async (
  db: Firestore,
  userId: string
) => {
  const areasCollection = collection(db, "areas");
  const q = query(
    areasCollection,
    where("userId", "==", userId),
    where("type", "==", "resource"),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchArchivedResourcesByUserId = async (
  db: Firestore,
  userId: string
) => {
  const areasCollection = collection(db, "areas");
  const q = query(
    areasCollection,
    where("userId", "==", userId),
    where("type", "==", "resource"),
    where("status", "==", "archived"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchResourceById = async (db: Firestore, resourceId: string) => {
  const docRef = doc(db, "areas", resourceId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data()?.type === "resource") {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

// Projects
const fetchAllProjectsByUserId = async (db: Firestore, userId: string) => {
  const projectsCollection = collection(db, "projects");
  const q = query(
    projectsCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchActiveProjectsByUserId = async (
  db: Firestore,
  userId: string
) => {
  const projectsCollection = collection(db, "projects");
  const q = query(
    projectsCollection,
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchArchivedProjectsByUserId = async (
  db: Firestore,
  userId: string
) => {
  const projectsCollection = collection(db, "projects");
  const q = query(
    projectsCollection,
    where("userId", "==", userId),
    where("status", "==", "archived"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchProjectById = async (db: Firestore, projectId: string) => {
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

const fetchProjectsByAreaId = async (db: Firestore, areaId: string) => {
  const projectsCollection = collection(db, "projects");
  const q = query(
    projectsCollection,
    where("areaId", "==", areaId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchProjectsByLoopId = async (db: Firestore, loopId: string) => {
  const projectsCollection = collection(db, "projects");
  const q = query(
    projectsCollection,
    where("loopIds", "array-contains", loopId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

// Tasks
const fetchAllTasksByUserId = async (db: Firestore, userId: string) => {
  const tasksCollection = collection(db, "tasks");
  const q = query(
    tasksCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchAllTasksByProjectId = async (
  db: Firestore,
  projectId: string
) => {
  const tasksCollection = collection(db, "tasks");
  const q = query(
    tasksCollection,
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return extractDataFromQuerySnapshot(querySnapshot);
};

const fetchTaskById = async (db: Firestore, taskId: string) => {
  const docRef = doc(db, "tasks", taskId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

// Loops
const fetchAllLoopsByUserId = async (db: Firestore, userId: string): Promise<LoopDocument[]> => {
  const loopsCollection: CollectionReference<DocumentData> = collection(db, "loops");
  const q = query(
    loopsCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
  return extractDataFromQuerySnapshot<LoopDocument>(querySnapshot);
};

const fetchLoopById = async (db: Firestore, loopId: string): Promise<LoopDocument | null> => {
  const docRef: DocumentReference<DocumentData> = doc(db, "loops", loopId);
  const docSnap: DocumentSnapshot<DocumentData> = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as LoopDocument;
  } else {
    return null;
  }
};

// Archive - Fetching all archived items regardless of type
const fetchArchivedItemsByUserId = async (db: Firestore, userId: string) => {
  const archivedItems: any[] = [];

  // Fetch archived areas
  const archivedAreas = await fetchArchivedAreasByUserId(db, userId);
  archivedItems.push(...archivedAreas);

  // Fetch archived resources
  const archivedResources = await fetchArchivedResourcesByUserId(db, userId);
  archivedItems.push(...archivedResources);

  // Fetch archived projects
  const archivedProjects = await fetchArchivedProjectsByUserId(db, userId);
  archivedItems.push(...archivedProjects);

  // Fetch archived tasks
  const tasksCollection = collection(db, "tasks");
  const qTasks = query(
    tasksCollection,
    where("userId", "==", userId),
    where("status", "==", "archived"),
    orderBy("createdAt", "desc")
  );
  const archivedTasks = await getDocs(qTasks);
  archivedItems.push(...extractDataFromQuerySnapshot(archivedTasks));

  return archivedItems;
};

export {
  app,
  auth,
  db,
  googleProvider,
  fetchAllAreasByUserId,
  fetchActiveAreasByUserId,
  fetchArchivedAreasByUserId,
  fetchAreaById,
  fetchAllResourcesByUserId,
  fetchActiveResourcesByUserId,
  fetchArchivedResourcesByUserId,
  fetchResourceById,
  fetchAllProjectsByUserId,
  fetchActiveProjectsByUserId,
  fetchArchivedProjectsByUserId,
  fetchProjectById,
  fetchProjectsByAreaId,
  fetchProjectsByLoopId,
  fetchAllTasksByUserId,
  fetchAllTasksByProjectId,
  fetchTaskById,
  fetchAllLoopsByUserId,
  fetchLoopById,
  fetchArchivedItemsByUserId,
};
