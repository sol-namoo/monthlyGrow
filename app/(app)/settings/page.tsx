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
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { signOut } from "firebase/auth";
import {
  updateUserSettings,
  updateUserPreferences,
  updateUserProfile,
  uploadProfilePicture,
  updateUserProfilePicture,
} from "@/lib/firebase/index";
import { resetTimeZoneCache } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Edit2, Check, X, Save, Loader2, BookOpen } from "lucide-react";
import Image from "next/image";

// 설정 폼 스키마 정의 (Firebase Auth 정보 제외)
const settingsFormSchema = z.object({
  defaultReward: z.string().optional(),
  defaultRewardEnabled: z.boolean(),
  aiRecommendations: z.boolean(),
  notifications: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["ko", "en"]),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSettings, isLoading } = useSettings();
  const { translate, currentLanguage } = useLanguage();
  const [user, userLoading] = useAuthState(auth);
  const router = useRouter();

  // 사용자 이름 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");

  // Default reward 편집 상태
  const [isEditingDefaultReward, setIsEditingDefaultReward] = useState(false);
  const [newDefaultReward, setNewDefaultReward] = useState("");

  // 설정 저장 상태
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  // 프로필 사진 업로드 상태
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 번역 텍스트 (메모이제이션 제거)
  const texts = {
    // 페이지 제목
    title: translate("settings.title"),
    loading: translate("settings.loading"),

    // 프로필 섹션
    profile: translate("settings.profile"),
    avatarChange: translate("settings.avatarChange"),
    username: translate("settings.username"),
    usernamePlaceholder: translate("settings.usernamePlaceholder"),
    noName: translate("settings.noName"),
    email: translate("settings.email"),
    noEmail: translate("settings.noEmail"),

    // 먼슬리 설정 섹션
    monthlySettings: translate("settings.monthlySettings"),
    defaultReward: translate("settings.defaultReward"),
    defaultRewardPlaceholder: translate("settings.defaultRewardPlaceholder"),
    defaultRewardEnabled: translate("settings.defaultRewardEnabled"),
    defaultRewardDisabled: translate("settings.defaultRewardDisabled"),

    // 테마 설정 섹션
    themeSettings: translate("settings.themeSettings"),
    theme: translate("settings.theme"),
    language: translate("settings.language"),
    deviceSettingsNote: translate("settings.deviceSettingsNote"),

    // 계정 섹션
    account: translate("settings.account"),
    logout: translate("settings.logout"),
    logoutDescription: translate("settings.logoutDescription"),

    // 테마 옵션
    themeLight: translate("theme.light"),
    themeDark: translate("theme.dark"),
    themeSystem: translate("theme.system"),

    // 언어 옵션
    languageKorean: translate("language.korean"),
    languageEnglish: translate("language.english"),

    // 토스트 메시지
    save: translate("settings.save"),
    saveSuccess: translate("settings.saveSuccess"),
    saveSuccessDescription: translate("settings.saveSuccessDescription"),
    saveError: translate("settings.saveError"),
    saveErrorDescription: translate("settings.saveErrorDescription"),
    nameRequired: translate("settings.nameRequired"),
    nameRequiredDescription: translate("settings.nameRequiredDescription"),
    nameChangeSuccess: translate("settings.nameChangeSuccess"),
    nameChangeSuccessDescription: translate(
      "settings.nameChangeSuccessDescription"
    ),
    nameChangeError: translate("settings.nameChangeError"),
    nameChangeErrorDescription: translate(
      "settings.nameChangeErrorDescription"
    ),
    logoutSuccess: translate("settings.logoutSuccess"),
    logoutSuccessDescription: translate("settings.logoutSuccessDescription"),
    logoutError: translate("settings.logoutError"),
    logoutErrorDescription: translate("settings.logoutErrorDescription"),
    // 에러 메시지
    errorSettingsSave: translate("settings.errorMessage.settingsSave"),
    errorNameChange: translate("settings.errorMessage.nameChange"),
    errorDefaultRewardSave: translate(
      "settings.errorMessage.defaultRewardSave"
    ),
    errorLogout: translate("settings.errorMessage.logout"),
  };

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
  const saveSetting = async (
    key: string,
    value: any,
    successMessage?: string
  ) => {
    setSavingStates((prev) => ({ ...prev, [key]: true }));

    try {
      await updateSettings({ [key]: value });

      toast({
        title: successMessage || texts.saveSuccess,
        description: texts.saveSuccessDescription,
      });
    } catch (error: any) {
      console.error(texts.errorSettingsSave + ":", error);
      console.error("Error details:", {
        key,
        value,
        error: error?.message || "Unknown error",
        stack: error?.stack,
      });
      toast({
        title: texts.saveError,
        description: texts.saveErrorDescription,
        variant: "destructive",
      });
    } finally {
      setSavingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  // 언어 변경 핸들러
  const handleLanguageChange = async (value: "ko" | "en") => {
    const currentValue = form.getValues("language");

    // 값이 실제로 변경되었을 때만 저장
    if (value !== currentValue) {
      form.setValue("language", value);
      await saveSetting(
        "language",
        value,
        texts.language + " " + texts.saveSuccess
      );

      // 언어 변경 시 타임존 캐시 초기화
      resetTimeZoneCache();

      // 언어 변경 후 부드러운 전환을 위해 약간의 지연 후 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // 테마 변경 핸들러
  const handleThemeChange = async (value: "light" | "dark" | "system") => {
    const currentValue = form.getValues("theme");

    // 값이 실제로 변경되었을 때만 저장
    if (value !== currentValue) {
      form.setValue("theme", value);
      await saveSetting("theme", value, texts.theme + " " + texts.saveSuccess);
    }
  };

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
        title: texts.nameRequired,
        description: texts.nameRequiredDescription,
        variant: "destructive",
      });
      return;
    }

    try {
      await updateUserProfile(user?.uid || "", {
        displayName: newDisplayName.trim(),
      });
      setIsEditingName(false);
      setNewDisplayName("");

      toast({
        title: texts.nameChangeSuccess,
        description: texts.nameChangeSuccessDescription,
      });
    } catch (error) {
      console.error(texts.errorNameChange + ":", error);
      toast({
        title: texts.nameChangeError,
        description: texts.nameChangeErrorDescription,
        variant: "destructive",
      });
    }
  };

  // Default reward 편집 시작
  const startEditingDefaultReward = () => {
    setNewDefaultReward(form.getValues("defaultReward") || "");
    setIsEditingDefaultReward(true);
  };

  // Default reward 편집 취소
  const cancelEditingDefaultReward = () => {
    setIsEditingDefaultReward(false);
    setNewDefaultReward("");
  };

  // Default reward 저장
  const saveDefaultReward = async () => {
    try {
      await saveSetting(
        "defaultReward",
        newDefaultReward.trim(),
        texts.defaultReward + " " + texts.saveSuccess
      );
      setIsEditingDefaultReward(false);
      setNewDefaultReward("");
    } catch (error) {
      console.error(texts.errorDefaultRewardSave + ":", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: texts.logoutSuccess,
        description: texts.logoutSuccessDescription,
      });
      router.push("/login");
    } catch (error) {
      console.error(texts.errorLogout + ":", error);
      toast({
        title: texts.logoutError,
        description: texts.logoutErrorDescription,
        variant: "destructive",
      });
    }
  };

  // 프로필 사진 업로드 함수
  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingPhoto(true);
    try {
      const downloadURL = await uploadProfilePicture(file, user.uid);
      await updateUserProfilePicture(user.uid, downloadURL);

      // 성공 메시지 표시
      toast({
        title: translate("settings.profilePictureUpload.success"),
        description: translate(
          "settings.profilePictureUpload.successDescription"
        ),
      });

      // 파일 input 초기화 (같은 파일을 다시 선택할 수 있도록)
      event.target.value = "";
    } catch (error) {
      console.error("프로필 사진 업로드 실패:", error);
      toast({
        title: translate("settings.profilePictureUpload.error"),
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading || userLoading) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{texts.loading}</p>
        </div>
      </div>
    );
  }

  const handleOnboardingRestart = () => {
    router.push("/onboarding");
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <h1 className="mb-6 text-2xl font-bold">{texts.title}</h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-xl font-bold">{texts.profile}</h2>
          <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
            <div className="mb-6 flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 relative overflow-hidden rounded-full border-4 border-primary/20 bg-secondary">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile Picture"
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <CharacterAvatar size="lg" level={5} />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  id="profile-picture-upload"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                  // 파일 크기 제한을 브라우저에서도 미리 체크
                  onInput={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && file.size > 2 * 1024 * 1024) {
                      // 2MB
                      toast({
                        title: "파일 크기 제한",
                        description:
                          "프로필 이미지는 2MB 이하의 파일만 업로드 가능합니다.",
                        variant: "destructive",
                      });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploadingPhoto}
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (!isUploadingPhoto) {
                      document
                        .getElementById("profile-picture-upload")
                        ?.click();
                    }
                  }}
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {translate("settings.profilePictureUpload.uploading")}
                    </>
                  ) : (
                    texts.avatarChange
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {translate("settings.profilePictureUpload.fileFormatInfo")}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="username">{texts.username}</Label>
              {isEditingName ? (
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="username"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="flex-1"
                    placeholder={texts.usernamePlaceholder}
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
                    value={user?.displayName || texts.noName}
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
              <Label htmlFor="email">{texts.email}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || texts.noEmail}
                className="mt-1"
                readOnly
                disabled
              />
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">{texts.monthlySettings}</h2>
          <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="defaultRewardEnabled">
                  {texts.defaultReward}
                </Label>
                <Switch
                  id="defaultRewardEnabled"
                  checked={form.watch("defaultRewardEnabled")}
                  onCheckedChange={async (checked) => {
                    form.setValue("defaultRewardEnabled", checked);
                    await saveSetting(
                      "defaultRewardEnabled",
                      checked,
                      texts.defaultReward + " " + texts.saveSuccess
                    );
                  }}
                  disabled={savingStates["defaultRewardEnabled"]}
                />
              </div>
              {form.watch("defaultRewardEnabled") && (
                <div className="space-y-2">
                  {isEditingDefaultReward ? (
                    <div className="flex items-center gap-2">
                      <Textarea
                        id="defaultReward"
                        value={newDefaultReward}
                        onChange={(e) => setNewDefaultReward(e.target.value)}
                        className="flex-1"
                        placeholder={texts.defaultRewardPlaceholder}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveDefaultReward}
                        className="px-2"
                        disabled={savingStates["defaultReward"]}
                      >
                        {savingStates["defaultReward"] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingDefaultReward}
                        className="px-2"
                        disabled={savingStates["defaultReward"]}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Textarea
                        id="defaultReward"
                        value={form.watch("defaultReward") || ""}
                        className="flex-1"
                        readOnly
                        disabled
                        placeholder={texts.defaultRewardPlaceholder}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={startEditingDefaultReward}
                        className="px-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {form.watch("defaultRewardEnabled")
                  ? texts.defaultRewardEnabled
                  : texts.defaultRewardDisabled}
              </p>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">{texts.themeSettings}</h2>
          <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">{texts.theme}</Label>
                <select
                  id="theme"
                  value={form.watch("theme")}
                  onChange={(e) =>
                    handleThemeChange(
                      e.target.value as "light" | "dark" | "system"
                    )
                  }
                  disabled={savingStates["theme"]}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="light">{texts.themeLight}</option>
                  <option value="dark">{texts.themeDark}</option>
                  <option value="system">{texts.themeSystem}</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {texts.deviceSettingsNote}
                </p>
              </div>

              <div>
                <Label htmlFor="language">{texts.language}</Label>
                <select
                  id="language"
                  value={form.watch("language")}
                  onChange={(e) =>
                    handleLanguageChange(e.target.value as "ko" | "en")
                  }
                  disabled={savingStates["language"]}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="ko">{texts.languageKorean}</option>
                  <option value="en">{texts.languageEnglish}</option>
                </select>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">도움말 및 가이드</h2>
          <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    앱 사용법 다시 보기
                  </Label>
                  <p className="text-xs text-gray-500">
                    앱 사용법을 다시 확인하세요
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOnboardingRestart}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  시작
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* 로그아웃 섹션 */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-foreground">
          {texts.account}
        </h2>
        <Card className="p-4 border-border bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">{texts.logout}</h3>
              <p className="text-sm text-muted-foreground">
                {texts.logoutDescription}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={userLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              {texts.logout}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
