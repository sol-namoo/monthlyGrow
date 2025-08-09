import { useQuery } from "@tanstack/react-query";
import { fetchAllChaptersByUserId } from "./firebase";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Chapter } from "./types";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Project, ConnectedChapter, Chapter } from "@/lib/types";

const auth = getAuth();

const useChapters = () => {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const queryResult = useQuery({
    queryKey: ["chapters", user?.uid],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      return await fetchAllChaptersByUserId(user.uid);
    },
    enabled: !!user,
  });
  return queryResult;
};

// 프로젝트 조회 시 연결된 챕터 정보를 함께 가져오는 함수
export const getProjectWithConnectedChapters = async (
  projectId: string
): Promise<Project> => {
  // 1. 프로젝트 기본 정보 조회
  const projectDoc = await getDoc(doc(db, "projects", projectId));
  const projectData = projectDoc.data() as Project;

  // 2. 연결된 챕터 ID들로 챕터 정보 조회
  if (
    projectData.connectedChapters &&
    projectData.connectedChapters.length > 0
  ) {
    const chapterIds = projectData.connectedChapters as string[];
    const chaptersQuery = query(
      collection(db, "chapters"),
      where("__name__", "in", chapterIds)
    );

    const chaptersSnapshot = await getDocs(chaptersQuery);
    const connectedChapters: ConnectedChapter[] = [];

    chaptersSnapshot.forEach((doc) => {
      const chapterData = doc.data() as Chapter;
      connectedChapters.push({
        id: doc.id,
        title: chapterData.title,
        startDate: chapterData.startDate,
        endDate: chapterData.endDate,
      });
    });

    // 날짜순으로 정렬
    connectedChapters.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    return {
      ...projectData,
      connectedChapters,
    };
  }

  return projectData;
};

export default useChapters;
