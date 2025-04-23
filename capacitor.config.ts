import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.solopreneur.monthlygrow",
  appName: "MonthlyGrow",
  webDir: "out",
};

export default config;

// 다음에 할 것
// npm run build && npx next export 해서 out/ 생성
// npx cap copy 로 정적 리소스를 복사
// npx cap open android 또는 ios 로 앱 확인
