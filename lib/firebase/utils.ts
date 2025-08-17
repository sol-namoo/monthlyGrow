import { Timestamp } from "firebase/firestore";

// 데이터 생성 시 타임스탬프 설정 유틸리티
export const createTimestamp = () => Timestamp.now();

// 데이터 생성 시 기본 필드 설정
export const createBaseData = (userId: string) => ({
  userId,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(), // 생성 시에는 createdAt과 동일
});

// 데이터 수정 시 updatedAt 필드 업데이트
export const updateTimestamp = () => Timestamp.now();

// undefined 값을 필터링하는 유틸리티 함수
export const filterUndefinedValues = (obj: any): any => {
  const filtered: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      filtered[key] = value;
    }
  }
  return filtered;
}; 