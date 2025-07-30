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
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";

// 설정 폼 스키마 정의
const settingsFormSchema = z.object({
  username: z.string().min(1, "사용자 이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요"),
  defaultReward: z.string().optional(),
  defaultRewardEnabled: z.boolean(),
  carryOver: z.boolean(),
  aiRecommendations: z.boolean(),
  notifications: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSettings, isLoading } = useSettings();

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

  const onSubmit = (data: SettingsFormData) => {
    // 설정 업데이트
    updateSettings(data);

    toast({
      title: "설정 저장 완료",
      description: "설정이 저장되었습니다.",
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">설정</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              <Input
                id="username"
                {...form.register("username")}
                className="mt-1"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="mt-1"
                readOnly
                disabled
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">루프 설정</h2>
          <Card className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="defaultRewardEnabled">기본 보상 설정</Label>
                <Switch
                  id="defaultRewardEnabled"
                  checked={form.watch("defaultRewardEnabled")}
                  onCheckedChange={(checked) =>
                    form.setValue("defaultRewardEnabled", checked)
                  }
                />
              </div>
              <Textarea
                id="defaultReward"
                {...form.register("defaultReward")}
                className="mt-1"
                placeholder="루프 완료 시 기본 보상을 입력하세요"
                disabled={!form.watch("defaultRewardEnabled")}
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
                onCheckedChange={(checked) =>
                  form.setValue("carryOver", checked)
                }
              />
            </div>
          </Card>
        </section>

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
                onCheckedChange={(checked) =>
                  form.setValue("aiRecommendations", checked)
                }
              />
            </div>
          </Card>
        </section>

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
                onCheckedChange={(checked) =>
                  form.setValue("notifications", checked)
                }
              />
            </div>
          </Card>
        </section>

        <div className="flex justify-end">
          <Button type="submit">저장</Button>
        </div>
      </form>
    </div>
  );
}
