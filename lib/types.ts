// src/lib/types.ts

export interface Area {
    id: string;
    userId: string;
    name: string;
    description: string;
    status: 'active' | 'archived';
    createdAt: Date;
}

export interface Resource {
    id: string;
    userId: string;
    name: string;
    areaId?: string;
    description: string;
    status: 'active' | 'archived';
    createdAt: Date;
}

export interface Project {
    id: string;
    userId: string;
    areaId: string;
    title: string;
    description: string;
    targetCount: number;
    doneCount: number;
    status: 'active' | 'archived';
    loopIds: string[];
    createdAt: Date;
    dueDate: Date;
    addedMidway?: boolean; // 루프 중간에 추가되었는지 여부
    progress: number; // 프로젝트 진행 상황
    total: number; // 프로젝트 전체 목표치
}

export interface Task {
    id: string;
    userId: string;
    projectId: string;
    title: string;
    date: Date;
    duration: number;
    done: boolean;
    status?: 'active' | 'archived';
    createdAt: Date;
}

export interface Loop {
    id: string;
    userId: string;
    title: string; 
    startDate: Date;
    endDate: Date;
    status: 'in_progress' | 'ended';
    focusAreas: string[];
    projectIds: string[];
    reward?: string;
    createdAt: Date;
    completed?: boolean; // completed 필드 추가
    areas: string[]; // Areas 필드 추가
    doneCount: number; // 진행 완료 수 추가
    targetCount: number; // 전체 수 추가
    reflection?: string; // 회고 내용 추가 (optional)
}

export interface Snapshot {
    id: string;
    loopId: string;
    projectId: string;
    year: number;
    month: number;
    snapshotDate: Date;
    doneCount: number;
    targetCount: number;
    reward: string;
}
