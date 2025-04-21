import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Plus } from "lucide-react"
import Link from "next/link"

export default function AreaDetailPage({ params }: { params: { id: string } }) {
  // 샘플 데이터
  const area = {
    id: params.id,
    title: "건강",
    description: "신체적, 정신적 건강을 위한 장기적인 관심 영역",
    projects: [
      { id: 1, title: "아침 운동 습관화", progress: 18, total: 30 },
      { id: 2, title: "명상 습관 만들기", progress: 10, total: 20 },
    ],
    resources: [
      { id: 1, title: "운동 루틴 아이디어", type: "노트", date: "2025.05.10" },
      { id: 4, title: "건강식 레시피", type: "노트", date: "2025.05.03" },
    ],
    archives: [{ id: 1, title: "30일 요가 챌린지", type: "프로젝트", date: "2025.03.15", completed: true }],
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/para">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Area: {area.title}</h1>
      </div>

      <Card className="mb-6 p-4">
        <p className="text-muted-foreground">{area.description}</p>
      </Card>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">관련 프로젝트</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/project/new">
              <Plus className="mr-2 h-4 w-4" />새 프로젝트
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          {area.projects.map((project) => (
            <Card key={project.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{project.title}</h3>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span>진행률: {Math.round((project.progress / project.total) * 100)}%</span>
                  <span>
                    {project.progress}/{project.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-value"
                    style={{
                      width: `${Math.round((project.progress / project.total) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">관련 자료</h2>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />새 자료
          </Button>
        </div>

        <div className="space-y-3">
          {area.resources.map((resource) => (
            <Card key={resource.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{resource.title}</h3>
                  <span className="text-xs text-muted-foreground">{resource.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">{resource.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">보관 항목</h2>
        </div>

        <div className="space-y-3">
          {area.archives.map((archive) => (
            <Card key={archive.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{archive.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{archive.type}</span>
                    <span className={`text-xs ${archive.completed ? "text-green-600" : "text-red-600"}`}>
                      {archive.completed ? "완료" : "미완료"}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{archive.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
