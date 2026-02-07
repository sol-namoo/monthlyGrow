# 🔒 보안과 인증 완전 정리

## 📋 목차

1. [인증(Authentication)과 인가(Authorization)의 차이](#인증authentication과-인가authorization의-차이)
2. [Firebase Authentication 작동 원리](#firebase-authentication-작동-원리)
3. [Security Rules가 왜 필요한가?](#security-rules가-왜-필요한가)
4. [클라이언트 측 보안의 한계](#클라이언트-측-보안의-한계)
5. [실제 공격 시나리오와 방어](#실제-공격-시나리오와-방어)
6. [보안 규칙 작성 모범 사례](#보안-규칙-작성-모범-사례)
7. [프로젝트 보안 구조 분석](#프로젝트-보안-구조-분석)

---

## 인증(Authentication)과 인가(Authorization)의 차이

### 🔐 기본 개념

**인증 (Authentication) = "당신이 누구인가?"**
- 사용자의 신원을 확인하는 과정
- 예: 로그인 (이메일/비밀번호, Google 로그인)
- 결과: 사용자 ID (UID) 획득

**인가 (Authorization) = "당신이 무엇을 할 수 있는가?"**
- 사용자가 특정 리소스에 접근할 권한이 있는지 확인
- 예: 자신의 프로젝트만 수정 가능
- 결과: 접근 허용/거부

### 📊 비교표

| 항목 | 인증 (Authentication) | 인가 (Authorization) |
|------|---------------------|-------------------|
| **질문** | "당신이 누구인가?" | "당신이 무엇을 할 수 있는가?" |
| **확인 대상** | 사용자 신원 | 접근 권한 |
| **시점** | 로그인 시 | 모든 요청 시 |
| **Firebase 서비스** | Firebase Auth | Firestore Security Rules |
| **예시** | 이메일/비밀번호 확인 | 자신의 데이터만 접근 가능 |

### 🎯 실제 프로젝트 예시

**1. 인증 (Authentication)**
```typescript
// 로그인 페이지에서
const result = await signInWithEmailAndPassword(auth, email, password);
const user = result.user;  // user.uid 획득
```

**2. 인가 (Authorization)**
```javascript
// Security Rules에서
match /projects/{projectId} {
  allow read, write: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
}
```

**플로우:**
```
1. 사용자 로그인 (인증)
   → Firebase Auth가 JWT 토큰 발급
   → 토큰에 user.uid 포함

2. 데이터 요청 (인가)
   → 클라이언트가 토큰과 함께 요청
   → Security Rules가 토큰 검증
   → user.uid와 resource.data.userId 비교
   → 일치하면 허용, 불일치하면 거부
```

---

## Firebase Authentication 작동 원리

### 🔍 인증 프로세스

#### 1. 로그인 플로우

**이메일/비밀번호 로그인:**
```244:265:monthlyGrow/app/(auth)/login/page.tsx
  // 이메일/비밀번호 로그인
  const handleEmailSignIn = async () => {
    setIsLoading(true);
    setFormError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // 사용자 문서가 존재하는지 확인하고, 없으면 온보딩 페이지로 이동
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        router.push("/onboarding");
      } else {
        router.push("/home");
      }
    } catch (error: any) {
      setFormError(getAuthErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };
```

**처리 과정:**
```
1. 클라이언트: 이메일/비밀번호 입력
2. Firebase Auth 서버: 비밀번호 해시 검증
3. Firebase Auth 서버: JWT 토큰 발급
4. 클라이언트: 토큰 저장 (자동)
5. 이후 모든 요청: 토큰 자동 포함
```

#### 2. JWT 토큰 구조

**JWT (JSON Web Token) 구성:**
```
Header.Payload.Signature

Header: {
  "alg": "RS256",
  "kid": "key-id"
}

Payload: {
  "uid": "user123",
  "email": "user@example.com",
  "iat": 1234567890,  // 발급 시간
  "exp": 1234571490   // 만료 시간
}

Signature: Firebase 서버가 서명
```

**특징:**
- ✅ 서버에서 검증 가능 (서명 확인)
- ✅ 클라이언트에서 변조 불가능
- ✅ 만료 시간 포함 (보안 강화)

#### 3. 인증 상태 관리

**useAuth 훅:**
```1:50:monthlyGrow/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // 이미 리다이렉션을 처리했거나 로딩 중이면 무시
    if (hasRedirected || loading) {
      return;
    }

    if (requireAuth && !user) {
      // 인증이 필요한 페이지에서 로그인되지 않은 경우
      if (!isRedirecting) {
        setIsRedirecting(true);
        setHasRedirected(true);
        router.push("/login");
      }
    } else if (!requireAuth && user) {
      // 인증이 필요하지 않은 페이지(로그인 페이지)에서 로그인된 경우
      if (!isRedirecting) {
        setIsRedirecting(true);
        setHasRedirected(true);
        router.push("/home");
      }
    }
  }, [user, loading, requireAuth, router, isRedirecting, hasRedirected]);

  // 에러가 발생한 경우 리다이렉션 상태 리셋
  useEffect(() => {
    if (error) {
      setIsRedirecting(false);
      setHasRedirected(false);
    }
  }, [error]);

  return {
    user,
    loading: loading || isRedirecting,
    isAuthenticated: !!user,
    error,
    isRedirecting,
  };
}
```

**작동 원리:**
1. `useAuthState`가 Firebase Auth 상태 모니터링
2. 로그인 상태 변경 시 자동 감지
3. 인증 필요 페이지에서 미인증 시 로그인 페이지로 리다이렉트
4. 로그인 페이지에서 인증 시 홈으로 리다이렉트

---

## Security Rules가 왜 필요한가?

### ⚠️ 클라이언트 측 보안의 한계

**중요한 사실: 클라이언트 코드는 완전히 노출됩니다!**

#### 문제 시나리오 1: 클라이언트 코드만으로 보안

**잘못된 방법:**
```typescript
// 클라이언트 코드에서만 검증
const fetchProjects = async (userId: string) => {
  if (auth.currentUser?.uid !== userId) {
    throw new Error("권한 없음");
  }
  return await getDocs(query(collection(db, "projects"), where("userId", "==", userId)));
};
```

**공격 방법:**
```typescript
// 공격자가 브라우저 개발자 도구에서 실행
const maliciousCode = async () => {
  // 다른 사용자의 데이터 조회 시도
  const otherUserProjects = await getDocs(
    query(collection(db, "projects"), where("userId", "==", "otherUserId"))
  );
  // Security Rules가 없으면 성공! 😱
};
```

#### 문제 시나리오 2: Security Rules 없이

**현재 상태 (개발 모드):**
```31:55:monthlyGrow/firestore.rules
  service cloud.firestore {
  match /databases/{database}/documents {

    // 🔐 먼슬리 정보
    match /monthlies/{monthlyId} {
      allow read, write: if true;    }

    // 🔐 프로젝트 정보
    match /projects/{projectId} {
      allow read, write: if true;    }

    // 🔐 태스크 정보
    match /tasks/{taskId} {
      allow read, write: if true;    }

    // 🔐 사용자 프로필 (optional)
    match /users/{userId} {
      allow read, write: if true;    }

    // 🔒 나머지는 차단
    match /{document=**} {
      allow read, write: true;

    }
  }
}
```

**위험성:**
- ❌ 누구나 모든 데이터 접근 가능
- ❌ 다른 사용자의 데이터 조회/수정 가능
- ❌ 데이터 삭제 가능
- ❌ 완전한 보안 취약점!

### ✅ Security Rules의 역할

**Security Rules = 서버 측 보안 검증**

**작동 원리:**
```
1. 클라이언트가 Firestore에 요청
   ↓
2. Firebase 서버가 요청 수신
   ↓
3. Security Rules 실행 (서버 측)
   ↓
4. 규칙 검증
   - 인증 확인: request.auth != null
   - 권한 확인: request.auth.uid == resource.data.userId
   ↓
5. 허용/거부 결정
   - 허용: 데이터 반환
   - 거부: 에러 반환
```

**중요한 점:**
- ✅ **서버 측에서 실행**: 클라이언트가 우회 불가능
- ✅ **모든 요청 검증**: 읽기/쓰기 모두 검증
- ✅ **자동 적용**: 개발자가 별도 코드 작성 불필요

---

## 클라이언트 측 보안의 한계

### 🚫 클라이언트에서 할 수 없는 것

#### 1. 비밀 정보 보호 불가능

**잘못된 방법:**
```typescript
// 클라이언트 코드에 API 키 포함
const API_KEY = "secret-key-12345";  // ❌ 노출됨!
```

**공격:**
- 브라우저 개발자 도구에서 코드 확인
- 네트워크 탭에서 요청 확인
- API 키 추출 가능

**올바른 방법:**
- Security Rules에서 서버 측 검증
- Firebase Functions 사용 (서버 측 실행)

#### 2. 클라이언트 검증은 우회 가능

**잘못된 방법:**
```typescript
// 클라이언트에서만 검증
if (auth.currentUser?.uid !== project.userId) {
  return;  // ❌ 우회 가능!
}
await updateDoc(doc(db, "projects", projectId), updateData);
```

**공격:**
```typescript
// 공격자가 브라우저 콘솔에서 실행
// if 문을 건너뛰고 직접 updateDoc 호출
await updateDoc(doc(db, "projects", "otherUserProjectId"), {
  title: "해킹됨"
});
// Security Rules가 없으면 성공! 😱
```

**올바른 방법:**
```javascript
// Security Rules에서 검증
match /projects/{projectId} {
  allow update: if request.auth != null &&
                request.auth.uid == resource.data.userId;
}
```

#### 3. 클라이언트 코드는 변조 가능

**공격 시나리오:**
1. 공격자가 브라우저 개발자 도구 열기
2. JavaScript 코드 수정
3. 보안 검증 코드 제거
4. 직접 Firestore 접근 시도

**방어:**
- Security Rules는 서버 측에서 실행
- 클라이언트 코드 변조와 무관하게 작동

### ✅ 클라이언트에서 해야 할 것

**클라이언트의 역할:**
1. ✅ 사용자 경험 (UX)
   - 로딩 상태 표시
   - 에러 메시지 표시
   - 폼 검증 (빠른 피드백)

2. ✅ UI 보호
   - 인증되지 않은 사용자에게 데이터 숨기기
   - 권한 없는 버튼 비활성화

**하지만:**
- ❌ 보안 검증은 클라이언트에 의존하면 안 됨
- ✅ Security Rules가 최종 보안 담당

---

## 실제 공격 시나리오와 방어

### 🎯 공격 시나리오 1: 다른 사용자 데이터 조회

**공격 코드:**
```typescript
// 공격자가 브라우저 콘솔에서 실행
const attack = async () => {
  // 다른 사용자의 프로젝트 조회 시도
  const otherUserProjects = await getDocs(
    query(collection(db, "projects"), where("userId", "==", "victimUserId"))
  );
  console.log("해킹된 데이터:", otherUserProjects.docs);
};
```

**Security Rules 없이:**
- ❌ 성공! 다른 사용자의 데이터 조회 가능

**Security Rules 있으면:**
```javascript
match /projects/{projectId} {
  allow read: if request.auth != null &&
              request.auth.uid == resource.data.userId;
}
```

**결과:**
- ✅ 각 문서마다 Security Rules 검증
- ✅ `request.auth.uid` (공격자) != `resource.data.userId` (피해자)
- ✅ 접근 거부!

### 🎯 공격 시나리오 2: 데이터 무단 수정

**공격 코드:**
```typescript
// 공격자가 다른 사용자의 프로젝트 수정 시도
const attack = async () => {
  await updateDoc(doc(db, "projects", "victimProjectId"), {
    title: "해킹됨",
    description: "보안 취약점 발견"
  });
};
```

**Security Rules 없이:**
- ❌ 성공! 다른 사용자의 데이터 수정 가능

**Security Rules 있으면:**
```javascript
match /projects/{projectId} {
  allow update: if request.auth != null &&
                request.auth.uid == resource.data.userId;
}
```

**결과:**
- ✅ `resource.data.userId` (기존 문서의 소유자) 확인
- ✅ 공격자의 UID와 불일치
- ✅ 접근 거부!

### 🎯 공격 시나리오 3: userId 위조

**공격 코드:**
```typescript
// 공격자가 자신의 UID로 다른 사용자의 데이터 생성 시도
const attack = async () => {
  await addDoc(collection(db, "projects"), {
    userId: "victimUserId",  // 다른 사용자로 위조
    title: "가짜 프로젝트",
    // ... 다른 필드들
  });
};
```

**약한 Security Rules:**
```javascript
// ❌ 잘못된 규칙
match /projects/{projectId} {
  allow create: if request.auth != null;  // userId 검증 없음!
}
```

**결과:**
- ❌ 성공! 다른 사용자 이름으로 데이터 생성 가능

**강한 Security Rules:**
```javascript
// ✅ 올바른 규칙
match /projects/{projectId} {
  allow create: if request.auth != null &&
                request.resource.data.userId == request.auth.uid;
}
```

**결과:**
- ✅ `request.resource.data.userId` (생성하려는 데이터의 userId)
- ✅ `request.auth.uid` (실제 로그인한 사용자의 UID)
- ✅ 불일치 시 접근 거부!

### 🎯 공격 시나리오 4: 인증 우회

**공격 코드:**
```typescript
// 공격자가 인증 없이 데이터 접근 시도
const attack = async () => {
  // 로그아웃 상태에서
  await getDocs(collection(db, "projects"));
};
```

**Security Rules:**
```javascript
match /projects/{projectId} {
  allow read: if request.auth != null &&  // 인증 확인
              request.auth.uid == resource.data.userId;
}
```

**결과:**
- ✅ `request.auth != null` 검증 실패
- ✅ 접근 거부!

---

## 보안 규칙 작성 모범 사례

### ✅ 기본 원칙

#### 1. 기본 거부 (Deny by Default)

**나쁜 예:**
```javascript
// 명시적으로 허용하지 않아도 기본적으로 허용
match /projects/{projectId} {
  // 규칙 없음 = 모든 접근 허용! ❌
}
```

**좋은 예:**
```javascript
// 명시적으로 허용하지 않은 모든 접근 차단
match /{document=**} {
  allow read, write: if false;  // 기본 거부
}

match /projects/{projectId} {
  allow read, write: if request.auth != null &&
                     request.auth.uid == resource.data.userId;
}
```

#### 2. 세분화된 권한 (Least Privilege)

**나쁜 예:**
```javascript
// 읽기/쓰기 모두 허용
match /projects/{projectId} {
  allow read, write: if request.auth != null &&
                     request.auth.uid == resource.data.userId;
}
```

**좋은 예:**
```javascript
// 읽기/쓰기를 분리하고 세분화
match /projects/{projectId} {
  // 읽기: 소유자만
  allow read: if request.auth != null &&
              request.auth.uid == resource.data.userId;
  
  // 생성: 인증된 사용자, userId 검증
  allow create: if request.auth != null &&
                request.resource.data.userId == request.auth.uid;
  
  // 수정: 소유자만, userId 변경 불가
  allow update: if request.auth != null &&
                request.auth.uid == resource.data.userId &&
                request.resource.data.userId == resource.data.userId;
  
  // 삭제: 소유자만
  allow delete: if request.auth != null &&
                request.auth.uid == resource.data.userId;
}
```

#### 3. 데이터 검증

**나쁜 예:**
```javascript
// 데이터 검증 없이 허용
match /projects/{projectId} {
  allow create: if request.auth != null;
}
```

**좋은 예:**
```javascript
// 필수 필드와 데이터 타입 검증
match /projects/{projectId} {
  allow create: if request.auth != null &&
                request.resource.data.userId == request.auth.uid &&
                request.resource.data.title is string &&
                request.resource.data.title.size() > 0 &&
                request.resource.data.title.size() <= 100 &&
                request.resource.data.createdAt is timestamp;
}
```

#### 4. userId 불변성 보장

**중요: userId는 절대 변경되면 안 됨!**

**나쁜 예:**
```javascript
// userId 변경 허용
match /projects/{projectId} {
  allow update: if request.auth != null &&
                request.auth.uid == resource.data.userId;
  // userId 변경 가능! ❌
}
```

**좋은 예:**
```javascript
// userId 변경 불가
match /projects/{projectId} {
  allow update: if request.auth != null &&
                request.auth.uid == resource.data.userId &&
                request.resource.data.userId == resource.data.userId;  // 변경 불가
}
```

### 📋 프로젝트 권장 규칙

**현재 프로젝트에 적용할 규칙:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 기본 거부
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Projects
    match /projects/{projectId} {
      allow read: if request.auth != null &&
                  request.auth.uid == resource.data.userId;
      
      allow create: if request.auth != null &&
                    request.resource.data.userId == request.auth.uid &&
                    request.resource.data.title is string &&
                    request.resource.data.title.size() > 0;
      
      allow update: if request.auth != null &&
                    request.auth.uid == resource.data.userId &&
                    request.resource.data.userId == resource.data.userId;
      
      allow delete: if request.auth != null &&
                    request.auth.uid == resource.data.userId;
      
      // 서브컬렉션: tasks
      match /tasks/{taskId} {
        allow read, write: if request.auth != null &&
                           get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
      }
    }
    
    // Monthlies
    match /monthlies/{monthlyId} {
      allow read: if request.auth != null &&
                  request.auth.uid == resource.data.userId;
      
      allow create: if request.auth != null &&
                    request.resource.data.userId == request.auth.uid;
      
      allow update: if request.auth != null &&
                    request.auth.uid == resource.data.userId &&
                    request.resource.data.userId == resource.data.userId;
      
      allow delete: if request.auth != null &&
                    request.auth.uid == resource.data.userId;
    }
    
    // Users
    match /users/{userId} {
      allow read, write: if request.auth != null &&
                         request.auth.uid == userId;
    }
  }
}
```

---

## 프로젝트 보안 구조 분석

### 🔍 현재 보안 구조

#### 1. 인증 구조

**Firebase Authentication 사용:**
- 이메일/비밀번호 로그인
- Google 로그인 (소셜 로그인)
- JWT 토큰 기반 인증

**인증 플로우:**
```
1. 사용자 로그인
   → Firebase Auth 서버에서 인증
   → JWT 토큰 발급
   → 클라이언트에 토큰 저장

2. 데이터 요청
   → 클라이언트가 토큰과 함께 요청
   → Firebase 서버가 토큰 검증
   → Security Rules 실행
```

#### 2. 데이터 격리 구조

**모든 문서에 userId 포함:**
```typescript
interface Project {
  id: string;
  userId: string;  // ← 모든 문서에 포함
  title: string;
  // ...
}
```

**Security Rules로 격리:**
```javascript
match /projects/{projectId} {
  allow read, write: if request.auth != null &&
                     request.auth.uid == resource.data.userId;
}
```

**결과:**
- ✅ 사용자별로 완전히 격리된 데이터
- ✅ 다른 사용자의 데이터 접근 불가능

#### 3. 현재 보안 상태

**⚠️ 개발 모드 (현재):**
```javascript
allow read, write: if true;  // 모든 접근 허용
```

**위험성:**
- ❌ 프로덕션 환경에서 사용하면 안 됨
- ❌ 모든 사용자가 모든 데이터 접근 가능
- ❌ 보안 취약점

**✅ 프로덕션 모드 (권장):**
```javascript
allow read, write: if request.auth != null &&
                   request.auth.uid == resource.data.userId;
```

**안전성:**
- ✅ 인증된 사용자만 접근
- ✅ 자신의 데이터만 접근
- ✅ 보안 강화

### 🎯 보안 체크리스트

**현재 프로젝트 보안 상태:**

- [x] Firebase Authentication 구현
- [x] userId 기반 데이터 구조
- [ ] Security Rules 활성화 (현재 개발 모드)
- [ ] 데이터 검증 규칙 추가
- [ ] 서브컬렉션 보안 규칙 추가
- [ ] 필수 필드 검증 규칙 추가

**프로덕션 배포 전 필수:**
1. Security Rules 활성화
2. 모든 컬렉션에 대한 보안 규칙 작성
3. 보안 규칙 테스트
4. 공격 시나리오 테스트

---

## 📊 정리: 보안 핵심 개념

### ✅ 기억해야 할 것

1. **인증 ≠ 인가**
   - 인증: "당신이 누구인가?" (Firebase Auth)
   - 인가: "당신이 무엇을 할 수 있는가?" (Security Rules)

2. **클라이언트 보안은 우회 가능**
   - 클라이언트 코드는 완전히 노출됨
   - Security Rules가 최종 보안 담당

3. **기본 거부 원칙**
   - 명시적으로 허용하지 않은 모든 접근 차단
   - Deny by Default

4. **세분화된 권한**
   - read, write를 분리
   - create, update, delete를 분리
   - 최소 권한 원칙

5. **데이터 검증**
   - 필수 필드 검증
   - 데이터 타입 검증
   - userId 불변성 보장

### 🎯 실무 팁

1. **개발 중에는 개발 모드 사용 OK**
   - 빠른 개발을 위해 임시로 허용
   - 하지만 프로덕션 배포 전 반드시 활성화!

2. **보안 규칙 테스트**
   - Firebase Emulator 사용
   - 다양한 시나리오 테스트

3. **에러 메시지 주의**
   - 보안 규칙 위반 시 에러 메시지 확인
   - 사용자에게는 일반적인 에러만 표시

4. **정기적인 보안 검토**
   - 새로운 컬렉션 추가 시 보안 규칙 추가
   - 보안 규칙 업데이트 시 테스트

---

## 📚 추가 학습 자료

### 공식 문서
- [Firebase Authentication 가이드](https://firebase.google.com/docs/auth)
- [Firestore Security Rules 가이드](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules 테스트](https://firebase.google.com/docs/firestore/security/test-rules)

### 보안 모범 사례
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase 보안 모범 사례](https://firebase.google.com/docs/rules/best-practices)

---

**작성일**: 2024년
**프로젝트**: Monthly Grow
**목적**: 보안과 인증 완전 정리

