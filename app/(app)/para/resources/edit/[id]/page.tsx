"use client";

import { Label } from "@/components/ui/label";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";

export default function EditResourcePage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [title, setTitle] = useState("");
  const [type, setType] = useState("note"); // 'note', 'link', 'file'
  const [content, setContent] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 샘플 Area 데이터
  const areas = [
    { id: "1", name: "건강" },
    { id: "2", name: "개발" },
    { id: "3", name: "마음" },
    { id: "4", name: "커리어" },
  ];

  // 샘플 Resource 데이터 (실제로는 ID에 따라 DB에서 데이터를 불러와야 함)
  const sampleResources = [
    {
      id: "1",
      title: "운동 루틴 아이디어",
      type: "note",
      content:
        "월: 전신 운동, 화: 유산소, 수: 휴식, 목: 상체, 금: 하체, 주말: 가벼운 활동",
      area: { id: "1", name: "건강" },
      tags: ["운동", "루틴", "건강"],
      createdAt: "2025.05.10",
    },
    {
      id: "2",
      title: "개발 참고 자료",
      type: "link",
      content: "https://react.dev/learn",
      area: { id: "2", name: "개발" },
      tags: ["React", "프론트엔드", "문서"],
      createdAt: "2025.05.08",
    },
    {
      id: "3",
      title: "명상 가이드",
      type: "file",
      content: "/files/meditation_guide.pdf",
      area: { id: "3", name: "마음" },
      tags: ["명상", "마음챙김", "PDF"],
      createdAt: "2025.05.05",
    },
  ];

  useEffect(() => {
    const foundResource = sampleResources.find((r) => r.id === id);
    if (foundResource) {
      setTitle(foundResource.title);
      setType(foundResource.type);
      setContent(foundResource.content);
      setSelectedArea(foundResource.area?.id || "");
      setTags(foundResource.tags || []);
    } else {
      toast({
        title: "자료를 찾을 수 없음",
        description: "해당 ID의 자료를 찾을 수 없습니다.",
        variant: "destructive",
      });
      router.push("/para?tab=resources"); // 자료 목록 페이지로 리다이렉트
    }
    setLoading(false);
  }, [id, router, toast]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !type) {
      toast({
        title: "자료 수정 실패",
        description: "제목, 유형, 내용을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const updatedResource = {
      id,
      title,
      type,
      content,
      areaId: selectedArea,
      tags,
      updatedAt: new Date().toISOString(), // 수정 시간 추가
    };

    console.log("자료 수정:", updatedResource);
    toast({
      title: "자료 수정 성공",
      description: "자료가 성공적으로 수정되었습니다.",
    });

    router.push(`/para/resources/${id}`); // 수정 후 상세 페이지로 이동
  };

  if (loading) {
    return (
      <div className="container max-w-md px-4 py-6 text-center">
        <p className="text-muted-foreground">자료를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/para/resources/${id}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">자료 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>자료 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="자료 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">유형</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="자료 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">노트</SelectItem>
                  <SelectItem value="link">링크</SelectItem>
                  <SelectItem value="file">파일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">내용 / 링크 / 파일 경로</Label>
              <Textarea
                id="content"
                placeholder={
                  type === "note"
                    ? "자료 내용을 입력하세요."
                    : type === "link"
                    ? "링크 URL을 입력하세요."
                    : "파일 경로를 입력하세요."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>
            <div>
              <Label htmlFor="area">연결할 Area (선택 사항)</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger id="area">
                  <SelectValue placeholder="Area 선택" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tags">태그</Label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="new-tag"
                  placeholder="새 태그 입력"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          변경 사항 저장
        </Button>
      </form>
    </div>
  );
}
