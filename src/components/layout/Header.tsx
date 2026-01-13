"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import type { Auth } from "../providers/DiscordActivity";
import { useF1Live } from "../providers/F1LiveProvider";
import { useSettings } from "../providers/SettingsProvider";
import { SettingsModal } from "~/components/modals/SettingsModal";

import logo from "../../../public/assets/logo.png";
import {
  ChevronDown,
  Cloud,
  CloudRain,
  Droplet,
  Info,
  LifeBuoy,
  LogOut,
  Settings,
  Bot,
  Sun,
  Thermometer,
  Wind,
  UserPlus,
} from "lucide-react";
import { discordSdk } from "~/lib/discord/client";

interface HeaderProps {
  auth: Auth | null;
  isEmbedded: boolean;
  signOut: () => Promise<void>;
}

function getAvatarUrl(userId: string, avatar: string | null): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`;
  }
  const defaultIndex = Number(BigInt(userId) % BigInt(5));
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
}

// OAuth login is now handled serverside with CSRF protection
const LOGIN_URL = "/api/auth/login";

export function Header({ auth, isEmbedded, signOut }: HeaderProps) {
  const { weather, connectionStatus, payload } = useF1Live();
  const { tempUnit, speedUnit } = useSettings();
  const event = payload?.event;
  const session = payload?.session;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        weatherRef.current &&
        !weatherRef.current.contains(event.target as Node)
      ) {
        setIsWeatherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine conditions based on rainfall
  const isRaining = weather ? parseFloat(weather.Rainfall) > 0 : false;
  const conditionsText = isRaining ? "Rainy" : "Clear";

  // Convert wind direction degrees to compass direction
  const getCompassDirection = (degrees: string): string => {
    const deg = parseFloat(degrees);
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index] ?? "N";
  };

  const getTemp = (temp: string | undefined) => {
    if (!temp) return "--";
    const val = parseFloat(temp);
    if (isNaN(val)) return "--";
    return tempUnit === "c" ? val.toFixed(1) : ((val * 9) / 5 + 32).toFixed(1);
  };

  const getSpeed = (speed: string | undefined) => {
    if (!speed) return "--";
    const val = parseFloat(speed);
    if (isNaN(val)) return "--";
    return speedUnit === "kph" ? val.toFixed(1) : (val * 0.621371).toFixed(1);
  };

  const windLabel = weather
    ? `Wind | ${getCompassDirection(weather.WindDirection)} ${weather.WindDirection}°`
    : "Wind";

  return (
    <header className="bg-background fixed top-0 right-0 left-0 z-50">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Logo and branding */}
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt="GridScout Logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded"
          />

          <div className="flex flex-col gap-0">
            {/* Top row */}
            <div className="flex items-center gap-2">
              <span className="text-primary text-base font-semibold tracking-wide">
                GRIDSCOUT
              </span>
              <span className="border-fire bg-fire/50 py-0.1 text-primary rounded-full border px-2 text-xs font-medium">
                LIVE
              </span>
            </div>

            {/* Bottom row */}
            <span className="text-secondary -mt-0.5 text-xs font-normal">
              Beta fdd515a
            </span>
          </div>
        </div>

        {/* Right side - Session, Weather data and User account */}
        <div className="flex items-center gap-6">
          {/* Session - Desktop */}
          <div className="hidden items-center gap-3 md:flex">
            {event?.country?.alpha3 && (
              <Image
                src={`/assets/flags/${event.country.alpha3}.png`}
                alt={event.country.name ?? event.country.alpha3}
                width={28}
                height={20}
                className="rounded-sm"
              />
            )}
            <div className="flex flex-col gap-0">
              <div className="flex items-center gap-2">
                <span className="text-primary text-base font-medium tracking-wide">
                  {event?.name ?? "--"}
                </span>
              </div>
              <span className="text-secondary -mt-0.5 text-xs font-medium">
                {session?.name ?? "Session"}
              </span>
            </div>
          </div>

          {/* Lap Counter - Desktop */}
          {session?.lap && (
            <div className="hidden items-center gap-3 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-lg">🏁</span>
              </div>
              <div className="flex flex-col gap-0">
                <span className="text-primary text-base font-medium tracking-wide">
                  {session.lap}{" "}
                  {session.lapTotal > 0 ? `/ ${session.lapTotal}` : ""}
                </span>
                <span className="text-secondary -mt-0.5 text-xs font-medium">
                  Lap
                </span>
              </div>
            </div>
          )}

          {/* Mobile Info Icon */}
          <div className="relative md:hidden" ref={weatherRef}>
            <button
              onClick={() => setIsWeatherOpen(!isWeatherOpen)}
              className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/5"
            >
              <Info className="h-5 w-5 text-gray-400" />
            </button>

            {/* Mobile Info Popup */}
            {isWeatherOpen && (
              <div className="border-border bg-sidebar absolute right-0 mt-2 w-64 rounded-xl border p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-primary text-xs font-semibold uppercase">
                    Session
                  </h4>
                  <button
                    onClick={() => setIsWeatherOpen(false)}
                    className="text-secondary hover:text-primary"
                  >
                    ✕
                  </button>
                </div>

                {/* Session Info */}
                {event && (
                  <div className="mb-4 flex items-center gap-2">
                    {event.country?.alpha3 && (
                      <Image
                        src={`/assets/flags/${event.country.alpha3}.png`}
                        alt={event.country.name ?? event.country.alpha3}
                        width={24}
                        height={17}
                        className="rounded-sm"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-primary text-sm font-medium">
                        {event.name}
                      </span>
                      <div className="flex items-center">
                        <span className="text-secondary text-xs">
                          {session?.name ?? "Session"}
                        </span>
                        {session && session.lapTotal > 0 && (
                          <span className="text-secondary pl-1 text-xs">
                            • Lap {session.lap}/{session.lapTotal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Weather Section Title */}
                <h4 className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
                  Weather
                </h4>

                <div className="flex flex-col gap-3">
                  {/* Conditions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isRaining ? (
                        <CloudRain className="h-4 w-4 text-[#2B7FFF]" />
                      ) : (
                        <Sun className="h-4 w-4 text-[#E0BF52]" />
                      )}
                      <span className="text-secondary text-xs">Conditions</span>
                    </div>
                    <span className="text-primary text-sm font-medium">
                      {conditionsText}
                    </span>
                  </div>

                  {/* Track Temp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-[#F7914D]" />
                      <span className="text-secondary text-xs">Track</span>
                    </div>
                    <span className="text-primary text-sm font-medium">
                      {getTemp(weather?.TrackTemp)}°{tempUnit.toUpperCase()}
                    </span>
                  </div>

                  {/* Air Temp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-[#F87069]" />
                      <span className="text-secondary text-xs">Air</span>
                    </div>
                    <span className="text-primary text-sm font-medium">
                      {getTemp(weather?.AirTemp)}°{tempUnit.toUpperCase()}
                    </span>
                  </div>

                  {/* Wind Speed */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-[#2B7FFF]" />
                      <span className="text-secondary text-xs">
                        {windLabel}
                      </span>
                    </div>
                    <span className="text-primary text-sm font-medium">
                      {getSpeed(weather?.WindSpeed)} {speedUnit.toUpperCase()}
                    </span>
                  </div>

                  {/* Pressure */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-[#EAEAE7]" />
                      <span className="text-secondary text-xs">Pressure</span>
                    </div>
                    <span className="text-primary text-sm font-medium">
                      {weather?.Pressure ?? "--"} hPa
                    </span>
                  </div>

                  {/* Humidity */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-[#2B7FFF]" />
                      <span className="text-secondary text-xs">Humidity</span>
                    </div>
                    <span className="text-primary text-sm font-medium">
                      {weather?.Humidity ?? "--"}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Weather components */}
          <div className="hidden items-center gap-6 md:flex">
            {/* Conditions */}
            <div className="flex items-center gap-3">
              {isRaining ? (
                <CloudRain className="text-[#2B7FFF]" />
              ) : (
                <Sun className="text-[#E0BF52]" />
              )}
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-base font-medium tracking-wide">
                    {conditionsText}
                  </span>
                </div>
                <span className="text-secondary -mt-0.5 text-xs font-medium">
                  Conditions
                </span>
              </div>
            </div>

            {/* Track Temp */}
            <div className="flex items-center gap-3">
              <Thermometer className="text-[#F7914D]" />
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-base font-medium tracking-wide">
                    {getTemp(weather?.TrackTemp)}°{tempUnit.toUpperCase()}
                  </span>
                </div>
                <span className="text-secondary -mt-0.5 text-xs font-medium">
                  Track
                </span>
              </div>
            </div>

            {/* Air Temp */}
            <div className="flex items-center gap-3">
              <Thermometer className="text-[#F87069]" />
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-base font-medium tracking-wide">
                    {getTemp(weather?.AirTemp)}°{tempUnit.toUpperCase()}
                  </span>
                </div>
                <span className="text-secondary -mt-0.5 text-xs font-medium">
                  Air
                </span>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="flex items-center gap-3">
              <Wind className="text-[#2B7FFF]" />
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-base font-medium tracking-wide">
                    {getSpeed(weather?.WindSpeed)} {speedUnit.toUpperCase()}
                  </span>
                </div>
                <span className="text-secondary -mt-0.5 text-xs font-medium">
                  {windLabel}
                </span>
              </div>
            </div>

            {/* Pressure */}
            <div className="flex items-center gap-3">
              <Cloud className="text-[#EAEAE7]" />
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-base font-medium tracking-wide">
                    {weather?.Pressure ?? "--"} hPa
                  </span>
                </div>
                <span className="text-secondary -mt-0.5 text-xs font-medium">
                  Pressure
                </span>
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="hidden items-center gap-3 md:flex">
            <Droplet className="text-[#2B7FFF]" />
            <div className="flex flex-col gap-0">
              <div className="flex items-center gap-2">
                <span className="text-primary text-base font-medium tracking-wide">
                  {weather?.Humidity ?? "--"}%
                </span>
              </div>
              <span className="text-secondary -mt-0.5 text-xs font-medium">
                Humidity
              </span>
            </div>
          </div>

          {/* User account */}
          <div className="flex items-center">
            {auth ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-colors"
                >
                  <Image
                    src={getAvatarUrl(auth.user.id, auth.user.avatar ?? null)}
                    alt={`${auth.user.username}'s avatar`}
                    width={28}
                    height={28}
                    className="rounded-full"
                    unoptimized
                  />
                  <span className="text-sm font-medium text-white">
                    {auth.user.global_name ?? auth.user.username}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="border-border bg-sidebar absolute right-0 mt-2 w-56 rounded-xl border p-2 shadow-2xl">
                    {/* Status Item */}
                    <div className="flex items-center justify-between rounded px-2 py-1.5 text-xs text-[#B5BAC1]">
                      <span className="font-medium">Data Source</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            connectionStatus === "connected"
                              ? "bg-[#23A559]"
                              : connectionStatus === "reconnecting"
                                ? "bg-[#E0BF52]"
                                : "bg-[#F23F42]"
                          }`}
                        />
                        <span
                          className={
                            connectionStatus === "connected"
                              ? "text-[#23A559]"
                              : connectionStatus === "reconnecting"
                                ? "text-[#E0BF52]"
                                : "text-[#F23F42]"
                          }
                        >
                          {connectionStatus === "connected"
                            ? "Connected"
                            : connectionStatus === "reconnecting"
                              ? "Reconnecting..."
                              : "Disconnected"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="text-primary flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>

                    {isEmbedded && (
                      <>
                        <button
                          onClick={async () => {
                            await discordSdk.commands.openInviteDialog();
                          }}
                          className="text-primary flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
                        >
                          <UserPlus className="h-4 w-4" />
                          Invite Friends
                        </button>
                      </>
                    )}

                    <div className="my-1 mt-2 h-px bg-[#2B2D31]" />

                    <a
                      href="https://discord.gg/gridscout"
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
                    >
                      <LifeBuoy className="h-4 w-4" />
                      Support
                    </a>
                    <a
                      href="#"
                      target="_blank"
                      rel="noreferrer"
                      className="text-secondary flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
                    >
                      <Bot className="h-4 w-4" />
                      Add Bot
                    </a>

                    {!isEmbedded && (
                      <>
                        <div className="my-1 h-px bg-[#2B2D31]" />

                        <button
                          onClick={() => void signOut()}
                          className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#F23F42] hover:bg-[#F23F42]/10"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <a
                href={LOGIN_URL}
                className="flex items-center gap-2 rounded-lg bg-[#5865f2] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4]"
              >
                Sign in
              </a>
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  );
}
