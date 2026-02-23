'use client';
// src/components/club-eligibility-gate.tsx
// Wraps the Create Club button — shows requirements if not eligible,
// opens the dialog if eligible.

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';
import { useClubEligibility } from '@/hooks/use-club-eligibility';
import { useState } from 'react';

interface ClubEligibilityGateProps {
  // The actual create club dialog trigger — only rendered if eligible
  children: React.ReactNode;
}

export function ClubEligibilityGate({ children }: ClubEligibilityGateProps) {
  const { isEligible, isLoading, requirements, unmetReasons } = useClubEligibility();
  const [showGate, setShowGate] = useState(false);

  if (isLoading) {
    return (
      <Button size="lg" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking eligibility...
      </Button>
    );
  }

  if (isEligible) {
    // Eligible — just render the create club dialog trigger as-is
    return <>{children}</>;
  }

  // Not eligible — show gate button that opens requirements dialog
  return (
    <>
      <Button size="lg" onClick={() => setShowGate(true)}>
        <Plus className="h-4 w-4 mr-2" />Create a Club
      </Button>

      <Dialog open={showGate} onOpenChange={setShowGate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Almost there! 📚</DialogTitle>
            <DialogDescription>
              To keep Kepha's clubs active and welcoming, you need to meet a few
              requirements before creating one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <RequirementRow
              met={requirements.hasUploadedBook}
              label="Upload at least 1 book to the library"
            />
            <RequirementRow
              met={requirements.hasFinishedBook}
              label="Finish reading at least 1 book"
            />
            <RequirementRow
              met={requirements.isClubMember}
              label="Join at least 1 existing club"
            />
          </div>

          <p className="text-sm text-muted-foreground pt-2">
            Complete the requirements above and you'll be able to create your own club! 🎉
          </p>

          <Button className="w-full mt-2" variant="outline" onClick={() => setShowGate(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
      {met ? (
        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive shrink-0" />
      )}
      <span className={`text-sm ${met ? 'text-muted-foreground line-through' : 'font-medium'}`}>
        {label}
      </span>
      {met && <Badge variant="secondary" className="ml-auto text-xs">Done</Badge>}
    </div>
  );
}