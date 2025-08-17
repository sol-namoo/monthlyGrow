import { useQuery } from "@tanstack/react-query";
import { fetchAllMonthliesByUserId } from "./firebase";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
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
import { Project, Monthly } from "@/lib/types";

const auth = getAuth();

const useMonthlies = () => {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const queryResult = useQuery({
    queryKey: ["monthlies", user?.uid],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      return await fetchAllMonthliesByUserId(user.uid);
    },
    enabled: !!user,
  });
  return queryResult;
};

// 프로젝트 조회 함수 (새로운 구조에서는 연결된 월간 정보가 필요 없음)
export const getProjectById = async (projectId: string): Promise<Project> => {
  const projectDoc = await getDoc(doc(db, "projects", projectId));
  const projectData = projectDoc.data() as Project;
  return projectData;
};

export default useMonthlies;
