import { Timestamp } from "firebase/firestore";

export interface Loop {
    userId: string;
    title: string;
    reward: string;
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'active' | 'archived';
}

export interface LoopDocument extends Loop {
    id: string;
    createdAt: Timestamp;
}
