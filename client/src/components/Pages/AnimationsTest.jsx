import React, { useState } from "react";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import LazyBackground from "../ui/LazyBackground";
import { EmptyState } from "../ui/EmptyState";

export default function AnimationsTest() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative min-h-screen p-8">
      <LazyBackground />
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Animations test</h1>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Card</h3>
              <p className="text-white/70">
                Hover and focus to see subtle scale.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setOpen(true)} animate>
                Open modal (animated)
              </Button>
              <Button onClick={() => setPlaying((p) => !p)} animate>
                Toggle MusicCard
              </Button>
            </div>
          </div>
        </Card>

        {!playing ? (
          <EmptyState
            title="No items"
            description="Toggle the music card to expand."
          />
        ) : (
          <Card>
            <div className="p-4">
              MusicCard expanded (see MusicCard interactions)
            </div>
          </Card>
        )}

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Animated Modal"
        >
          <div className="py-4">
            <p className="text-white/80">
              This modal uses react-spring for entrance animation.
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setOpen(false)} animate>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
