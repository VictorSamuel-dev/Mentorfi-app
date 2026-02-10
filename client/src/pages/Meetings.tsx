import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { Calendar, Clock, Video, Phone, MapPin, Plus, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getMeetings, createMeeting, updateMeetingStatus } from "@/lib/api";
import { format } from "date-fns";
import type { MeetingWithParticipant, Connection } from "@shared/schema";

async function getApprovedConnectionsEnriched(): Promise<{ connection: Connection; otherUser: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; company: string | null } }[]> {
  const res = await fetch("/api/connections/approved/enriched", { credentials: "include" });
  return res.json();
}

function formatIcon(fmt: string) {
  switch (fmt) {
    case "phone_call": return Phone;
    case "in_person": return MapPin;
    default: return Video;
  }
}

function formatLabel(fmt: string) {
  switch (fmt) {
    case "phone_call": return "Phone Call";
    case "in_person": return "In Person";
    default: return "Video Call";
  }
}

export default function Meetings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSchedule, setShowSchedule] = useState(false);
  const [formData, setFormData] = useState({
    connectionId: "",
    title: "",
    scheduledAt: "",
    durationMinutes: "30",
    format: "video_call",
    location: "",
    notes: "",
  });

  const { data: meetingsList = [], isLoading } = useQuery<MeetingWithParticipant[]>({
    queryKey: ["/api/meetings"],
    queryFn: getMeetings,
    enabled: !!user,
  });

  const { data: enrichedConnections = [] } = useQuery({
    queryKey: ["/api/connections/approved/enriched"],
    queryFn: getApprovedConnectionsEnriched,
    enabled: !!user,
  });

  const scheduleMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setShowSchedule(false);
      setFormData({ connectionId: "", title: "", scheduledAt: "", durationMinutes: "30", format: "video_call", location: "", notes: "" });
      toast({ title: "Meeting Scheduled", description: "Your meeting has been scheduled successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule meeting.", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateMeetingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Meeting Updated", description: "Meeting status updated." });
    },
  });

  if (authLoading) return null;
  if (!user) { setLocation("/auth"); return null; }

  const scheduled = meetingsList.filter(m => m.status === "scheduled");
  const past = meetingsList.filter(m => m.status !== "scheduled");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.connectionId || !formData.title || !formData.scheduledAt) return;
    scheduleMutation.mutate({
      connectionId: parseInt(formData.connectionId),
      title: formData.title,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      durationMinutes: parseInt(formData.durationMinutes),
      format: formData.format,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={true} user={user} role={user.role} />

      <main className="flex-1 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-meetings-title">Meetings</h1>
              <p className="text-muted-foreground">Schedule and manage 1-on-1 sessions</p>
            </div>
            <Button onClick={() => setShowSchedule(true)} className="gap-2" data-testid="button-schedule-meeting">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3">Upcoming ({scheduled.length})</h2>
                {scheduled.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming meetings</p>
                      <p className="text-sm mt-1">Schedule a meeting with one of your connections</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {scheduled.map((meeting) => {
                      const FormatIcon = formatIcon(meeting.format);
                      return (
                        <Card key={meeting.id} data-testid={`meeting-card-${meeting.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4 flex-wrap">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={meeting.otherUser.profileImageUrl || undefined} />
                                <AvatarFallback>
                                  {(meeting.otherUser.firstName?.[0] || "") + (meeting.otherUser.lastName?.[0] || "")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium">{meeting.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  with {meeting.otherUser.firstName} {meeting.otherUser.lastName}
                                  {meeting.otherUser.company && ` at ${meeting.otherUser.company}`}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {meeting.scheduledAt ? format(new Date(meeting.scheduledAt), "MMM d, yyyy 'at' h:mm a") : "TBD"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {meeting.durationMinutes} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FormatIcon className="h-3.5 w-3.5" />
                                    {formatLabel(meeting.format)}
                                  </span>
                                </div>
                                {meeting.notes && (
                                  <p className="text-sm mt-2 text-muted-foreground">{meeting.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => statusMutation.mutate({ id: meeting.id, status: "completed" })}
                                  data-testid={`button-complete-meeting-${meeting.id}`}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => statusMutation.mutate({ id: meeting.id, status: "cancelled" })}
                                  data-testid={`button-cancel-meeting-${meeting.id}`}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {past.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Past Meetings ({past.length})</h2>
                  <div className="space-y-3">
                    {past.map((meeting) => (
                      <Card key={meeting.id} className="opacity-75" data-testid={`meeting-past-${meeting.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4 flex-wrap">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={meeting.otherUser.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {(meeting.otherUser.firstName?.[0] || "") + (meeting.otherUser.lastName?.[0] || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{meeting.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                with {meeting.otherUser.firstName} {meeting.otherUser.lastName}
                              </p>
                            </div>
                            <Badge variant={meeting.status === "completed" ? "default" : "secondary"}>
                              {meeting.status === "completed" ? "Completed" : "Cancelled"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Connection</Label>
              <Select value={formData.connectionId} onValueChange={(v) => setFormData(p => ({ ...p, connectionId: v }))}>
                <SelectTrigger data-testid="select-meeting-connection">
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {enrichedConnections.map((ec: any) => (
                    <SelectItem key={ec.connection.id} value={String(ec.connection.id)}>
                      {ec.otherUser?.firstName} {ec.otherUser?.lastName}
                      {ec.otherUser?.company ? ` (${ec.otherUser.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Career guidance session"
                data-testid="input-meeting-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(p => ({ ...p, scheduledAt: e.target.value }))}
                data-testid="input-meeting-date"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={formData.durationMinutes} onValueChange={(v) => setFormData(p => ({ ...p, durationMinutes: v }))}>
                  <SelectTrigger data-testid="select-meeting-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={formData.format} onValueChange={(v) => setFormData(p => ({ ...p, format: v }))}>
                  <SelectTrigger data-testid="select-meeting-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video_call">Video Call</SelectItem>
                    <SelectItem value="phone_call">Phone Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Topics to discuss..."
                rows={3}
                data-testid="input-meeting-notes"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSchedule(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={!formData.connectionId || !formData.title || !formData.scheduledAt || scheduleMutation.isPending}
                data-testid="button-confirm-schedule"
              >
                {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
