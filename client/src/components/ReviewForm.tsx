import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { createReview, getReviewForConnection, getReviewsForUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { ReviewWithUser } from "@shared/schema";

interface ReviewFormProps {
  connectionId: number;
  revieweeId: string;
  revieweeName: string;
}

export function ReviewForm({ connectionId, revieweeId, revieweeName }: ReviewFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: existingReview } = useQuery({
    queryKey: ["/api/reviews/connection", connectionId],
    queryFn: () => getReviewForConnection(connectionId),
  });

  const mutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/connection", connectionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/user", revieweeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setRating(0);
      setComment("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit review.", variant: "destructive" });
    },
  });

  if (existingReview?.review) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < existingReview.review!.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            You already reviewed this connection
            {existingReview.review.comment && `: "${existingReview.review.comment}"`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Rate your experience with {revieweeName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1" data-testid="review-stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              data-testid={`star-${i + 1}`}
            >
              <Star
                className={`h-6 w-6 cursor-pointer transition-colors ${
                  i < (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={2}
          data-testid="input-review-comment"
        />
        <Button
          size="sm"
          disabled={rating === 0 || mutation.isPending}
          onClick={() => mutation.mutate({ connectionId, revieweeId, rating, comment: comment || undefined })}
          data-testid="button-submit-review"
        >
          {mutation.isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface ReviewsListProps {
  userId: string;
}

export function ReviewsList({ userId }: ReviewsListProps) {
  const { data } = useQuery({
    queryKey: ["/api/reviews/user", userId],
    queryFn: () => getReviewsForUser(userId),
  });

  if (!data || data.reviews.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="reviews-list">
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < Math.round(data.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{data.averageRating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({data.totalReviews} review{data.totalReviews !== 1 ? "s" : ""})</span>
      </div>
      <div className="space-y-2">
        {data.reviews.slice(0, 5).map((review: ReviewWithUser) => (
          <div key={review.id} className="flex items-start gap-3" data-testid={`review-${review.id}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={review.reviewer.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">
                {(review.reviewer.firstName?.[0] || "") + (review.reviewer.lastName?.[0] || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {review.reviewer.firstName} {review.reviewer.lastName}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : ""}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-0.5">{review.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
