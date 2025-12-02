"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamManagement } from "@/components/team/team-management"
import { useState, useEffect } from "react"

export default function SettingsPage() {
  const [theme, setTheme] = useState("light")
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const loadWorkspace = async () => {
    try {
      setError(null)
      const response = await fetch('/api/workspace')
      if (response.ok) {
        const data = await response.json()
        setWorkspaceId(data.workspace?.id || null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || 'Failed to load workspace'
        setError(errorMessage)
        
        // Check if it's a table doesn't exist error
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('Database tables not found. Please run the workspace schema migration in Supabase.')
        }
      }
    } catch (error: any) {
      console.error('Failed to load workspace:', error)
      setError(error.message || 'Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }

  const createWorkspace = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'My Workspace' }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setWorkspaceId(data.workspace?.id || null)
        setError(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to create workspace')
      }
    } catch (error: any) {
      console.error('Failed to create workspace:', error)
      setError(error.message || 'Failed to create workspace')
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    loadWorkspace()
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="ui">UI & Themes</TabsTrigger>
          <TabsTrigger value="flexboard">Flexboard</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">Loading team settings...</div>
              </CardContent>
            </Card>
          ) : workspaceId ? (
            <TeamManagement workspaceId={workspaceId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  {error || 'Workspace not found'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-muted-foreground">
                  {error ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-red-600">Error: {error}</p>
                      {error.includes('relation') || error.includes('does not exist') ? (
                        <div className="text-sm space-y-2 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="font-semibold text-yellow-900">Database Setup Required:</p>
                          <ol className="list-decimal list-inside space-y-1 text-yellow-800 text-left">
                            <li>Go to your Supabase Dashboard → SQL Editor</li>
                            <li>Open the file: <code className="bg-yellow-100 px-1 rounded">supabase/workspaces-schema.sql</code></li>
                            <li>Copy and paste the entire SQL script</li>
                            <li>Click &quot;Run&quot; to execute it</li>
                            <li>Refresh this page</li>
                          </ol>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground space-y-2 mt-2">
                          <p>This might be because:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>The database might not be set up correctly</li>
                            <li>The workspace tables might not exist</li>
                            <li>There might be a connection issue</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>You don&apos;t have a workspace yet. Create one to start inviting team members.</p>
                  )}
                </div>
                <Button 
                  onClick={createWorkspace} 
                  disabled={creating}
                  className="mt-4"
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </Button>
                <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                  <p className="font-semibold mb-2">How to invite team members:</p>
                  <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                    <li>Create a workspace (click button above)</li>
                    <li>Enter your teammate&apos;s email address</li>
                    <li>They&apos;ll receive an invitation</li>
                    <li>When they sign up with that email, they&apos;ll be prompted to join</li>
                  </ol>
                  <p className="mt-2 text-left max-w-md mx-auto">
                    <strong>Note:</strong> Teammates use the same sign-in system (Clerk) - they sign up with their email and password, no separate accounts needed!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic workspace configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your workspace
                  </p>
                </div>
                <Switch id="emailNotifications" name="emailNotifications" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">Auto-save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes
                  </p>
                </div>
                <Switch id="autoSave" name="autoSave" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" name="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="theme" value={theme} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flexboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flexboard Settings</CardTitle>
              <CardDescription>
                Configure your flexboard preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="snapToGrid">Snap to Grid</Label>
                  <p className="text-sm text-muted-foreground">
                    Align blops to grid automatically
                  </p>
                </div>
                <Switch id="snapToGrid" name="snapToGrid" checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultBlopShape">Default Blop Shape</Label>
                <Select defaultValue="circle">
                  <SelectTrigger id="defaultBlopShape" name="defaultBlopShape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="pill">Pill</SelectItem>
                    <SelectItem value="diamond">Diamond</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="defaultBlopShape" value="circle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardBackground">Board Background</Label>
                <Select defaultValue="grid">
                  <SelectTrigger id="boardBackground" name="boardBackground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="dots">Dots</SelectItem>
                    <SelectItem value="plain">Plain</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="boardBackground" value="grid" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect external services to your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">GoHighLevel</div>
                  <div className="text-sm text-muted-foreground">
                    CRM and marketing automation
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Vercel</div>
                  <div className="text-sm text-muted-foreground">
                    Deployment and hosting
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Stripe</div>
                  <div className="text-sm text-muted-foreground">
                    Payment processing
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export or import your workspace data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-muted-foreground">
                    Download all your workspace data as JSON
                  </div>
                </div>
                <Button variant="outline">Export</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Import Data</div>
                  <div className="text-sm text-muted-foreground">
                    Upload workspace data from a JSON file
                  </div>
                </div>
                <Button variant="outline">Import</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


