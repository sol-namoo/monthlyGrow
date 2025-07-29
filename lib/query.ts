import { useQuery } from "@tanstack/react-query";
import { fetchAllLoopsByUserId } from "./firebase";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loop } from "./types";
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
import { Project, ConnectedLoop, Loop } from "@/lib/types";

const auth = getAuth();

const useLoops = () => {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const queryResult = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      return await fetchAllLoopsByUserId(user.uid);
    },
    enabled: !!user,
  });
  return queryResult;
};

// 프로젝트 조회 시 연결된 루프 정보를 함께 가져오는 함수
export const getProjectWithConnectedLoops = async (
  projectId: string
): Promise<Project> => {
  // 1. 프로젝트 기본 정보 조회
  const projectDoc = await getDoc(doc(db, "projects", projectId));
  const projectData = projectDoc.data() as Project;

  // 2. 연결된 루프 ID들로 루프 정보 조회
  if (projectData.connectedLoops && projectData.connectedLoops.length > 0) {
    const loopIds = projectData.connectedLoops as string[];
    const loopsQuery = query(
      collection(db, "loops"),
      where("__name__", "in", loopIds)
    );

    const loopsSnapshot = await getDocs(loopsQuery);
    const connectedLoops: ConnectedLoop[] = [];

    loopsSnapshot.forEach((doc) => {
      const loopData = doc.data() as Loop;
      connectedLoops.push({
        id: doc.id,
        title: loopData.title,
        startDate: loopData.startDate,
        endDate: loopData.endDate,
      });
    });

    // 날짜순으로 정렬
    connectedLoops.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    return {
      ...projectData,
      connectedLoops,
    };
  }

  return projectData;
};

export default useLoops;
