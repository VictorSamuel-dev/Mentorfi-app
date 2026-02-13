import { useState, useEffect, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { Calendar, Clock, Video, Phone, MapPin, Plus, CheckCircle, XCircle, Sparkles, Loader2, Settings, Trash2, CalendarOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getMeetings, createMeeting, updateMeetingStatus } from "@/lib/api";
import { format } from "date-fns";
import type { MeetingWithParticipant, Connection, AvailabilitySlot, BlockedDate } from "@shared/schema";

interface MeetingPrepData {
  menteeOverview: string;
  conversationHighlights: string[];
  suggestedTopics: string[];
  questionsToAsk: string[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function timeToDisplay(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      options.push({ value, label: timeToDisplay(value) });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function AvailabilitySettings({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [slots, setSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/availability", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots.map((s: AvailabilitySlot) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })));
          setBlockedDates(data.blockedDates);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addSlot = () => {
    setSlots(prev => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, field: string, value: string | number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const saveSlots = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/availability/slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Availability saved", description: "Your weekly availability has been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save availability.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockDate) return;
    try {
      const res = await fetch("/api/availability/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blockedDate: newBlockDate, reason: newBlockReason || null }),
      });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setBlockedDates(prev => [...prev, result].sort((a, b) => a.blockedDate.localeCompare(b.blockedDate)));
      setNewBlockDate("");
      setNewBlockReason("");
      toast({ title: "Date blocked" });
    } catch {
      toast({ title: "Error", description: "Failed to block date.", variant: "destructive" });
    }
  };

  const removeBlockedDate = async (id: number) => {
    try {
      await fetch(`/api/availability/blocked-dates/${id}`, { method: "DELETE", credentials: "include" });
      setBlockedDates(prev => prev.filter(bd => bd.id !== id));
    } catch {
      toast({ title: "Error", description: "Failed to remove blocked date.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading availability settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h3 className="font-medium">Weekly Availability</h3>
          <Button size="sm" variant="outline" onClick={addSlot} className="gap-1" data-testid="button-add-slot">
            <Plus className="h-3.5 w-3.5" />
            Add Time Slot
          </Button>
        </div>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No availability set. Mentees can book any time. Add time slots to restrict when mentees can schedule meetings.</p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 flex-wrap" data-testid={`availability-slot-${idx}`}>
                <Select value={String(slot.dayOfWeek)} onValueChange={(v) => updateSlot(idx, "dayOfWeek", parseInt(v))}>
                  <SelectTrigger className="w-[130px]" data-testid={`select-slot-day-${idx}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((name, i) => (
                      <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={slot.startTime} onValueChange={(v) => updateSlot(idx, "startTime", v)}>
                  <SelectTrigger className="w-[120px]" data-testid={`select-slot-start-${idx}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">to</span>
                <Select value={slot.endTime} onValueChange={(v) => updateSlot(idx, "endTime", v)}>
                  <SelectTrigger className="w-[120px]" data-testid={`select-slot-end-${idx}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => removeSlot(idx)} data-testid={`button-remove-slot-${idx}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button onClick={saveSlots} disabled={saving} className="mt-3" data-testid="button-save-availability">
          {saving ? "Saving..." : "Save Availability"}
        </Button>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">Blocked Dates</h3>
        <p className="text-sm text-muted-foreground mb-3">Block specific dates when you're unavailable (vacations, holidays, etc.)</p>
        <div className="flex items-end gap-2 flex-wrap mb-3">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
              data-testid="input-block-date"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reason (optional)</Label>
            <Input
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
              placeholder="e.g., Vacation"
              data-testid="input-block-reason"
            />
          </div>
          <Button onClick={addBlockedDate} disabled={!newBlockDate} variant="outline" data-testid="button-add-blocked-date">
            Block Date
          </Button>
        </div>
        {blockedDates.length > 0 && (
          <div className="space-y-1.5">
            {blockedDates.map(bd => (
              <div key={bd.id} className="flex items-center gap-2 text-sm" data-testid={`blocked-date-${bd.id}`}>
                <CalendarOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{format(new Date(bd.blockedDate + "T00:00:00"), "MMM d, yyyy")}</span>
                {bd.reason && <span className="text-muted-foreground">- {bd.reason}</span>}
                <Button size="icon" variant="ghost" onClick={() => removeBlockedDate(bd.id)} data-testid={`button-remove-blocked-${bd.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Meetings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [prepMeetingId, setPrepMeetingId] = useState<number | null>(null);
  const [prepData, setPrepData] = useState<MeetingPrepData | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);

  const handleGetPrep = async (meetingId: number) => {
    setPrepMeetingId(meetingId);
    setPrepData(null);
    setPrepLoading(true);
    try {
      const res = await fetch(`/api/ai/meeting-prep/${meetingId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate prep");
      const data = await res.json();
      setPrepData(data);
    } catch {
      toast({ title: "Could not generate meeting prep", description: "AI features may be temporarily unavailable.", variant: "destructive" });
      setPrepMeetingId(null);
    } finally {
      setPrepLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    connectionId: "",
    title: "",
    scheduledDate: "",
    scheduledTime: "",
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

  const selectedConnection = useMemo(() => {
    if (!formData.connectionId) return null;
    return enrichedConnections.find((ec: any) => String(ec.connection.id) === formData.connectionId);
  }, [formData.connectionId, enrichedConnections]);

  const mentorIdForAvailability = useMemo(() => {
    if (!selectedConnection || !user) return null;
    if (user.role === "mentor") {
      return user.id;
    }
    return selectedConnection.otherUser?.id || null;
  }, [selectedConnection, user]);

  const { data: mentorAvailability } = useQuery<{ slots: AvailabilitySlot[]; blockedDates: BlockedDate[] }>({
    queryKey: ["/api/mentors", mentorIdForAvailability, "availability"],
    queryFn: async () => {
      const res = await fetch(`/api/mentors/${mentorIdForAvailability}/availability`, { credentials: "include" });
      return res.json();
    },
    enabled: !!mentorIdForAvailability,
  });

  const hasAvailabilitySet = mentorAvailability && mentorAvailability.slots.length > 0;
  const hasBlockedDates = mentorAvailability && mentorAvailability.blockedDates.length > 0;

  const availableTimeSlots = useMemo(() => {
    if (!formData.scheduledDate || !mentorAvailability || mentorAvailability.slots.length === 0) return null;

    const dateStr = formData.scheduledDate;
    const isBlocked = mentorAvailability.blockedDates.some(bd => bd.blockedDate === dateStr);
    if (isBlocked) return [];

    const selectedDate = new Date(dateStr + "T00:00:00");
    const dayOfWeek = selectedDate.getDay();
    const daySlots = mentorAvailability.slots.filter(s => s.dayOfWeek === dayOfWeek);
    if (daySlots.length === 0) return [];

    const duration = parseInt(formData.durationMinutes);
    const times: { value: string; label: string }[] = [];

    for (const slot of daySlots) {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const slotStartMin = startH * 60 + startM;
      const slotEndMin = endH * 60 + endM;

      for (let m = slotStartMin; m + duration <= slotEndMin; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const value = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        times.push({ value, label: timeToDisplay(value) });
      }
    }

    return times;
  }, [formData.scheduledDate, formData.durationMinutes, mentorAvailability]);

  const isDateBlocked = useMemo(() => {
    if (!formData.scheduledDate || !mentorAvailability) return false;
    return mentorAvailability.blockedDates.some(bd => bd.blockedDate === formData.scheduledDate);
  }, [formData.scheduledDate, mentorAvailability]);

  const hasAnyAvailabilityConfig = hasAvailabilitySet || hasBlockedDates;

  const scheduleMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setShowSchedule(false);
      setFormData({ connectionId: "", title: "", scheduledDate: "", scheduledTime: "", durationMinutes: "30", format: "video_call", location: "", notes: "" });
      toast({ title: "Meeting Scheduled", description: "Your meeting has been scheduled successfully." });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to schedule meeting.";
      toast({ title: "Error", description: message, variant: "destructive" });
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

  const isMentor = user.role === "mentor";
  const scheduled = meetingsList.filter(m => m.status === "scheduled");
  const past = meetingsList.filter(m => m.status !== "scheduled");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.connectionId || !formData.title || !formData.scheduledDate) return;

    let scheduledAt: string;
    if (formData.scheduledTime) {
      scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`).toISOString();
    } else {
      return;
    }

    scheduleMutation.mutate({
      connectionId: parseInt(formData.connectionId),
      title: formData.title,
      scheduledAt,
      durationMinutes: parseInt(formData.durationMinutes),
      format: formData.format,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    });
  };

  const availabilityHintForDate = () => {
    if (!formData.scheduledDate || !hasAnyAvailabilityConfig) return null;
    if (isDateBlocked) {
      return (
        <div className="flex items-center gap-1.5 text-sm text-destructive" data-testid="text-date-blocked">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>This date is blocked by the mentor</span>
        </div>
      );
    }
    if (availableTimeSlots && availableTimeSlots.length === 0) {
      const selectedDate = new Date(formData.scheduledDate + "T00:00:00");
      const dayName = DAY_NAMES[selectedDate.getDay()];
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="text-no-slots">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>No availability on {dayName}s</span>
        </div>
      );
    }
    return null;
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
            <div className="flex gap-2 flex-wrap">
              {isMentor && (
                <Button variant="outline" onClick={() => setShowAvailability(true)} className="gap-2" data-testid="button-manage-availability">
                  <Settings className="h-4 w-4" />
                  Availability
                </Button>
              )}
              <Button onClick={() => setShowSchedule(true)} className="gap-2" data-testid="button-schedule-meeting">
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
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
                              <div className="flex gap-2 shrink-0 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleGetPrep(meeting.id)}
                                  data-testid={`button-prep-meeting-${meeting.id}`}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  AI Prep
                                </Button>
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

      {/* AI Prep Dialog */}
      <Dialog open={prepMeetingId !== null} onOpenChange={(open) => { if (!open) { setPrepMeetingId(null); setPrepData(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Meeting Prep Brief
            </DialogTitle>
          </DialogHeader>
          {prepLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your meeting prep brief...</p>
            </div>
          ) : prepData ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Overview</h4>
                  <p className="text-sm text-muted-foreground">{prepData.menteeOverview}</p>
                </div>
                {prepData.conversationHighlights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Conversation Highlights</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {prepData.conversationHighlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">&#8226;</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {prepData.suggestedTopics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Suggested Topics</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {prepData.suggestedTopics.map((t, i) => (
                        <Badge key={i} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {prepData.questionsToAsk.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Questions to Ask</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {prepData.questionsToAsk.map((q, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">&#8226;</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Mentor Availability Settings Dialog */}
      <Dialog open={showAvailability} onOpenChange={setShowAvailability}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Availability
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="pr-4">
              <AvailabilitySettings onClose={() => setShowAvailability(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Connection</Label>
              <Select value={formData.connectionId} onValueChange={(v) => setFormData(p => ({ ...p, connectionId: v, scheduledDate: "", scheduledTime: "" }))}>
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

            {hasAvailabilitySet && formData.connectionId && (
              <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground" data-testid="text-availability-info">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">Mentor's Available Hours</span>
                </div>
                <div className="space-y-0.5">
                  {DAY_NAMES.map((name, i) => {
                    const daySlots = mentorAvailability!.slots.filter(s => s.dayOfWeek === i);
                    if (daySlots.length === 0) return null;
                    return (
                      <div key={i} className="flex items-center gap-1">
                        <span className="w-[60px] text-xs font-medium">{DAY_NAMES_SHORT[i]}</span>
                        <span className="text-xs">{daySlots.map(s => `${timeToDisplay(s.startTime)} - ${timeToDisplay(s.endTime)}`).join(", ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={formData.durationMinutes} onValueChange={(v) => setFormData(p => ({ ...p, durationMinutes: v, scheduledTime: "" }))}>
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
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(p => ({ ...p, scheduledDate: e.target.value, scheduledTime: "" }))}
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-meeting-date"
              />
              {availabilityHintForDate()}
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              {hasAvailabilitySet && availableTimeSlots !== null ? (
                availableTimeSlots.length > 0 ? (
                  <Select value={formData.scheduledTime} onValueChange={(v) => setFormData(p => ({ ...p, scheduledTime: v }))}>
                    <SelectTrigger data-testid="select-meeting-time">
                      <SelectValue placeholder="Select available time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">No available times on this date</p>
                )
              ) : (
                <Select value={formData.scheduledTime} onValueChange={(v) => setFormData(p => ({ ...p, scheduledTime: v }))}>
                  <SelectTrigger data-testid="select-meeting-time">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
                disabled={!formData.connectionId || !formData.title || !formData.scheduledDate || !formData.scheduledTime || scheduleMutation.isPending}
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
