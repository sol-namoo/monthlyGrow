import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { Note } from "../types";

// Notes
export const createNote = async (
  noteData: Omit<Note, "id" | "createdAt" | "updatedAt">
): Promise<Note> => {
  try {
    if (!noteData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    const baseData = createBaseData(noteData.userId);
    const newNote = {
      ...noteData,
      ...baseData,
    };

    const docRef = await addDoc(collection(db, "notes"), newNote);
    console.log(`✅ 노트 생성 완료 - ID: ${docRef.id}`);

    return {
      id: docRef.id,
      ...newNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Note;
  } catch (error) {
    console.error("❌ 노트 생성 실패:", error);
    if (error instanceof Error) {
      throw new Error(`노트 생성에 실패했습니다: ${error.message}`);
    }
    throw new Error("노트 생성에 실패했습니다.");
  }
};

export const updateNote = async (
  noteId: string,
  updateData: Partial<Omit<Note, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "notes", noteId), filteredData);
    console.log(`✅ 노트 업데이트 완료 - ID: ${noteId}`);
  } catch (error) {
    console.error(`❌ 노트 업데이트 실패 - ID: ${noteId}`, error);
    throw new Error("노트 업데이트에 실패했습니다.");
  }
};
