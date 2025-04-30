    import { useQuery } from "react-query";
    import { fetchAllLoopsByUserId } from "./firebase";
    import { getAuth } from "firebase/auth";
    import { useRouter } from "next/navigation";
    import { Loop } from "./types";
    import { useEffect } from "react";
    import { useAuthState } from "react-firebase-hooks/auth";

    const auth = getAuth();

    const useLoops = () => {
        const [user, loading] = useAuthState(auth);
        const router = useRouter();

        useEffect(() => {
            if (!user && !loading) {
                router.push("/login");
            }
        }, [user, loading, router]);

        const queryResult = useQuery<Loop[], Error>(
            ["loops", user?.uid],
            async () => {
                if (!user) {
                    return [];
                }
                return await fetchAllLoopsByUserId(user.uid);
            },
            {
                enabled: !!user,
            },
        );
        return queryResult;
    };

    export default useLoops;
