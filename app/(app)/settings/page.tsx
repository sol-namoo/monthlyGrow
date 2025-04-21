"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CharacterAvatar } from "@/components/character-avatar"
import { useState } from "react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    username: "루퍼",
    email: "looper@example.com",
    defaultReward: "좋아하는 카페에서 디저트 먹기",
    carryOver: true,
    aiRecommendations: true,
    notifications: true,
  })

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">설정</h1>

      <section className="mb-8">
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
              value={settings.username}
              onChange={(e) => updateSetting("username", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting("email", e.target.value)}
              className="mt-1"
            />
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">루프 설정</h2>
        <Card className="p-4">
          <div className="mb-4">
            <Label htmlFor="default-reward">기본 보상 설정</Label>
            <Textarea
              id="default-reward"
              value={settings.defaultReward}
              onChange={(e) => updateSetting("defaultReward", e.target.value)}
              className="mt-1"
              placeholder="루프 완료 시 기본 보상을 입력하세요"
            />
            <p className="mt-1 text-xs text-muted-foreground">새 루프 생성 시 기본으로 설정될 보상입니다.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="carry-over">미완료 항목 이월</Label>
              <p className="text-xs text-muted-foreground">완료하지 못한 항목을 다음 루프로 이월합니다.</p>
            </div>
            <Switch
              id="carry-over"
              checked={settings.carryOver}
              onCheckedChange={(checked) => updateSetting("carryOver", checked)}
            />
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">AI 설정</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-recommendations">AI 추천 허용</Label>
              <p className="text-xs text-muted-foreground">AI가 루프와 프로젝트에 대한 추천을 제공합니다.</p>
            </div>
            <Switch
              id="ai-recommendations"
              checked={settings.aiRecommendations}
              onCheckedChange={(checked) => updateSetting("aiRecommendations", checked)}
            />
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">알림 설정</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">알림 허용</Label>
              <p className="text-xs text-muted-foreground">루프와 프로젝트 관련 알림을 받습니다.</p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={(checked) => updateSetting("notifications", checked)}
            />
          </div>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button>저장</Button>
      </div>
    </div>
  )
}
