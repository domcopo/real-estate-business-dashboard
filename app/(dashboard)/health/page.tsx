import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle2, Circle } from "lucide-react"

export default function HealthPage() {
  const tasks = [
    { id: "1", title: "Morning workout", completed: true },
    { id: "2", title: "Read for 30 minutes", completed: false },
    { id: "3", title: "Meditation", completed: false },
  ]

  const habits = [
    { id: "1", name: "Exercise", streak: 7 },
    { id: "2", name: "Read", streak: 12 },
    { id: "3", name: "Meditate", streak: 5 },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health & Productivity</h1>
          <p className="text-muted-foreground">
            Track your habits, tasks, and wellness
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s Tasks</CardTitle>
              <Button variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Your daily to-do list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      task.completed
                        ? "text-muted-foreground line-through"
                        : ""
                    }
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader>
            <CardTitle>Habits</CardTitle>
            <CardDescription>Track your daily habits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{habit.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {habit.streak} day streak
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Check
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


