"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CharacterAvatar } from "@/components/character-avatar";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { updateUserDisplayName } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Edit2, Check, X, Save, Loader2 } from "lucide-react";

// 설정 폼 스키마 정의 (Firebase Auth 정보 제외)
const settingsFormSchema = z.object({
  defaultReward: z.string().optional(),
  defaultRewardEnabled: z.boolean(),
  carryOver: z.boolean(),
  aiRecommendations: z.boolean(),
  notifications: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["ko", "en"]),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSettings, isLoading } = useSettings();
  const [user, userLoading] = useAuthState(auth);
  const router = useRouter();

  // 사용자 이름 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");

  // 설정 저장 상태
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: settings,
  });

  // 설정이 로드되면 폼에 설정값 적용
  useEffect(() => {
    if (!isLoading) {
      form.reset(settings);
    }
  }, [settings, isLoading, form]);

  // 실시간 설정 저장
  const saveSetting = useCallback(
    async (key: string, value: any, successMessage?: string) => {
      setSavingStates((prev) => ({ ...prev, [key]: true }));

      try {
        console.log(`Saving setting: ${key} = ${value}`);
        await updateSettings({ [key]: value });
        console.log(`Setting saved successfully: ${key} = ${value}`);

        toast({
          title: successMessage || "설정 저장 완료",
          description: "설정이 Firestore에 저장되었습니다.",
        });
      } catch (error: any) {
        console.error("설정 저장 실패:", error);
        console.error("Error details:", {
          key,
          value,
          error: error?.message || "Unknown error",
          stack: error?.stack,
        });
        toast({
          title: "설정 저장 실패",
          description: "Firestore에 설정을 저장하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setSavingStates((prev) => ({ ...prev, [key]: false }));
      }
    },
    [updateSettings, toast]
  );

  // 사용자 이름 편집 시작
  const startEditingName = () => {
    setNewDisplayName(user?.displayName || "");
    setIsEditingName(true);
  };

  // 사용자 이름 편집 취소
  const cancelEditingName = () => {
    setIsEditingName(false);
    setNewDisplayName("");
  };

  // 사용자 이름 저장
  const saveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      toast({
        title: "이름을 입력해주세요",
        description: "사용자 이름은 비워둘 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateUserDisplayName(newDisplayName.trim());
      setIsEditingName(false);
      setNewDisplayName("");

      toast({
        title: "이름 변경 완료",
        description: "사용자 이름이 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error("이름 변경 실패:", error);
      toast({
        title: "이름 변경 실패",
        description: "이름 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다.",
      });
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || userLoading) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">설정</h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-bold">프로필</h2>
          <Card className="p-4">
            <div className="mb-6 flex flex-col items-center">
              <CharacterAvatar size="lg" level={5} className="mb-4" />
              <Button variant="outline" size="sm">
                아바타 변경
              </Button>
            </div>

            <div className="mb-4">
              <Label htmlFor="username">사용자 이름</Label>
              {isEditingName ? (
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="username"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="flex-1"
                    placeholder="사용자 이름을 입력하세요"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveDisplayName}
                    className="px-2"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cancelEditingName}
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="username"
                    value={user?.displayName || "이름 없음"}
                    className="flex-1"
                    readOnly
                    disabled
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={startEditingName}
                    className="px-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || "이메일 없음"}
                className="mt-1"
                readOnly
                disabled
              />
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">루프 설정</h2>
          <Card className="p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="defaultRewardEnabled">기본 보상 설정</Label>
                <Switch
                  id="defaultRewardEnabled"
                  checked={form.watch("defaultRewardEnabled")}
                  onCheckedChange={async (checked) => {
                    form.setValue("defaultRewardEnabled", checked);
                    await saveSetting(
                      "defaultRewardEnabled",
                      checked,
                      "기본 보상 설정이 저장되었습니다."
                    );
                  }}
                  disabled={savingStates["defaultRewardEnabled"]}
                />
              </div>
              <Textarea
                id="defaultReward"
                {...form.register("defaultReward")}
                className="mt-1"
                placeholder="루프 완료 시 기본 보상을 입력하세요"
                disabled={
                  !form.watch("defaultRewardEnabled") ||
                  savingStates["defaultReward"]
                }
                onBlur={async () => {
                  const value = form.getValues("defaultReward");
                  await saveSetting(
                    "defaultReward",
                    value,
                    "기본 보상이 저장되었습니다."
                  );
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.watch("defaultRewardEnabled")
                  ? "새 루프 생성 시 기본으로 설정될 보상입니다."
                  : "기본 보상 설정이 비활성화되어 있습니다. 활성화하면 새 루프 생성 시 자동으로 보상이 채워집니다."}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="carryOver">미완료 항목 이월</Label>
                <p className="text-xs text-muted-foreground">
                  완료하지 못한 항목을 다음 루프로 이월합니다.
                </p>
              </div>
              <Switch
                id="carryOver"
                checked={form.watch("carryOver")}
                onCheckedChange={async (checked) => {
                  form.setValue("carryOver", checked);
                  await saveSetting(
                    "carryOver",
                    checked,
                    "이월 설정이 저장되었습니다."
                  );
                }}
                disabled={savingStates["carryOver"]}
              />
            </div>
          </Card>
        </section>

        {/* AI 설정 - 임시 주석처리
        <section>
          <h2 className="mb-4 text-xl font-bold">AI 설정</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="aiRecommendations">AI 추천 허용</Label>
                <p className="text-xs text-muted-foreground">
                  AI가 루프와 프로젝트에 대한 추천을 제공합니다.
                </p>
              </div>
              <Switch
                id="aiRecommendations"
                checked={form.watch("aiRecommendations")}
                onCheckedChange={async (checked) => {
                  form.setValue("aiRecommendations", checked);
                  await saveSetting(
                    "aiRecommendations",
                    checked,
                    "AI 설정이 저장되었습니다."
                  );
                }}
                disabled={savingStates["aiRecommendations"]}
              />
            </div>
          </Card>
        </section>
        */}

        {/* 알림 설정 - 임시 주석처리
        <section>
          <h2 className="mb-4 text-xl font-bold">알림 설정</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">알림 허용</Label>
                <p className="text-xs text-muted-foreground">
                  루프와 프로젝트 관련 알림을 받습니다.
                </p>
              </div>
              <Switch
                id="notifications"
                checked={form.watch("notifications")}
                onCheckedChange={async (checked) => {
                  form.setValue("notifications", checked);
                  await saveSetting(
                    "notifications",
                    checked,
                    "알림 설정이 저장되었습니다."
                  );
                }}
                disabled={savingStates["notifications"]}
              />
            </div>
          </Card>
        </section>
        */}

        <section>
          <h2 className="mb-4 text-xl font-bold">테마 설정</h2>
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">테마</Label>
                <select
                  id="theme"
                  value={form.watch("theme")}
                  onChange={async (e) => {
                    const value = e.target.value as "light" | "dark" | "system";
                    const currentValue = form.getValues("theme");

                    // 값이 실제로 변경되었을 때만 저장
                    if (value !== currentValue) {
                      form.setValue("theme", value);
                      await saveSetting(
                        "theme",
                        value,
                        "테마 설정이 저장되었습니다."
                      );
                    }
                  }}
                  disabled={savingStates["theme"]}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="light">라이트</option>
                  <option value="dark">다크</option>
                  <option value="system">시스템</option>
                </select>
              </div>

              <div>
                <Label htmlFor="language">언어</Label>
                <select
                  id="language"
                  value={form.watch("language")}
                  onChange={async (e) => {
                    const value = e.target.value as "ko" | "en";
                    const currentValue = form.getValues("language");

                    // 값이 실제로 변경되었을 때만 저장
                    if (value !== currentValue) {
                      form.setValue("language", value);
                      await saveSetting(
                        "language",
                        value,
                        "언어 설정이 저장되었습니다."
                      );
                    }
                  }}
                  disabled={savingStates["language"]}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* 로그아웃 섹션 */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-foreground">계정</h2>
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">로그아웃</h3>
              <p className="text-sm text-muted-foreground">
                현재 계정에서 로그아웃합니다.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={userLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              로그아웃
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
