import { useQuery } from "@tanstack/react-query";
import { db, fetchAllLoopsByUserId } from "./firebase";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loop, LoopDocument } from "./types";

const auth = getAuth();

const useLoops = () => {
  const router = useRouter();
  const user = auth.currentUser;

  return useQuery<Loop[]>({
    queryKey: ["loops"],
    queryFn: async () => {
      if (!user) {
        localStorage.clear();
        router.push("/login");
        return [];
      }
      const loops = await fetchAllLoopsByUserId(db, user.uid);
      return loops.map(({ id, createdAt, ...loop }) => ({ // Destructure to remove id and createdAt
        ...loop
      }));
    },
  });
};
export { useLoops };
