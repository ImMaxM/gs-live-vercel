"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useSettings } from "../providers/SettingsProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SegmentedControl({
  options,
  value,
  onChange,
  name,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}) {
  return (
    <div className="relative flex rounded-lg bg-[#111214] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex-1 cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option.value
              ? "text-white"
              : "text-[#949BA4] hover:text-[#DBDEE1]"
          }`}
        >
          {value === option.value && (
            <motion.div
              layoutId={`segmented-bg-${name}`}
              className="absolute inset-0 -z-10 rounded bg-[#404249] shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    speedUnit,
    setSpeedUnit,
    tempUnit,
    setTempUnit,
    setStreamDelayEnabled,
    streamDelaySeconds,
    setStreamDelaySeconds,
    soundEnabled,
    setSoundEnabled,
  } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="border-border bg-sidebar pointer-events-auto w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#2B2D31] px-4 py-3">
                <h2 className="text-lg font-semibold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded p-1 text-[#B5BAC1] transition-colors hover:bg-[#35373C] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6 p-4">
                {/* Units Section */}
                <section>
                  <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                    <span>Units</span>
                  </div>

                  <div className="divide-y divide-[#2B2D31] rounded-lg">
                    {/* Speed Unit */}
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <div className="text-primary text-sm font-medium">
                          Speed
                        </div>
                      </div>
                      <div className="border-border w-32 rounded-md border">
                        <SegmentedControl
                          name="speed"
                          value={speedUnit}
                          onChange={(val) => setSpeedUnit(val as "mph" | "kph")}
                          options={[
                            { label: "MPH", value: "mph" },
                            { label: "KPH", value: "kph" },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Temperature Unit */}
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Temperature
                        </div>
                      </div>
                      <div className="border-border w-fit rounded-md border">
                        <SegmentedControl
                          name="temp"
                          value={tempUnit}
                          onChange={(val) => setTempUnit(val as "c" | "f")}
                          options={[
                            { label: "Celsius", value: "c" },
                            { label: "Fahrenheit", value: "f" },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Stream Section */}
                <section>
                  <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                    <span>Data Stream</span>
                  </div>

                  <div className="space-y-4 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-primary text-sm font-medium">
                          Broadcast Delay
                        </div>
                        <div className="text-xs text-[#949BA4]">
                          Delay dashboard updates to sync with your video feed
                        </div>
                      </div>
                      <div className="text-primary text-sm font-medium tabular-nums">
                        {streamDelaySeconds === 0
                          ? "Live"
                          : `${Math.floor(streamDelaySeconds / 60)}m ${String(streamDelaySeconds % 60).padStart(2, "0")}s`}
                      </div>
                    </div>

                    <div className="relative flex items-center gap-3">
                      <span className="text-xs font-medium text-[#949BA4]">
                        Live
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="300"
                        step="1"
                        value={streamDelaySeconds}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setStreamDelaySeconds(val);
                          setStreamDelayEnabled(val > 0);
                        }}
                        className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-[#111214]"
                        style={{
                          backgroundImage: `linear-gradient(to right, #5865F2 0%, #5865F2 ${(streamDelaySeconds / 300) * 100}%, #404249 ${(streamDelaySeconds / 300) * 100}%, #404249 100%)`,
                        }}
                      />
                      <span className="text-xs font-medium text-[#949BA4]">
                        5m
                      </span>
                    </div>
                  </div>
                </section>

                {/* Notifications Section */}
                <section>
                  <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                    <span>Notifications</span>
                  </div>

                  <div className="divide-y divide-[#2B2D31] rounded-lg">
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <div className="text-primary text-sm font-medium">
                          Sound Alerts
                        </div>
                        <div className="text-xs text-[#949BA4]">
                          Play sounds for flag changes and race control messages
                        </div>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${
                          soundEnabled ? "bg-[#5865F2]" : "bg-[#404249]"
                        }`}
                      >
                        <div
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                            soundEnabled ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
