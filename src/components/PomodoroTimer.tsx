"use client"
import React, { useRef, useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { ChevronDown, Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { useTimer } from "react-timer-hook"

type TimerMode = "moderate" | "severe" | "neurotypical" | "custom"
type TimerPeriod = "work" | "shortBreak" | "longBreak"

interface TimerPreset {
  work: number; // in minutes
  shortBreak: number;
  longBreak: number;
  color: string;
  label: string;
}

const PRESETS: Record<TimerMode, TimerPreset> = {
  moderate: { work: 15, shortBreak: 5, longBreak: 10, color: "bg-blue-500", label: "Moderate ADHD" },
  severe: { work: 10, shortBreak: 3, longBreak: 8, color: "bg-purple-500", label: "Severe ADHD" },
  neurotypical: { work: 25, shortBreak: 5, longBreak: 15, color: "bg-green-500", label: "Neurotypical" },
  custom: { work: 25, shortBreak: 5, longBreak: 15, color: "bg-amber-500", label: "Custom" },
}

const PomodoroTimer = () => {
  const modeSelectorRef = useRef<HTMLButtonElement>(null)
  const [currentMode, setCurrentMode] = useState<TimerMode>("moderate")
  const [currentPeriod, setCurrentPeriod] = useState<TimerPeriod>("work")
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showCustomSettings, setShowCustomSettings] = useState(false)
  
  // Custom time settings
  // Add state for input values
  const [inputValues, setInputValues] = useState({
    work: '25',
    shortBreak: '5',
    longBreak: '15'
  });
  
  const [customTimes, setCustomTimes] = useState({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
  })

  const getExpiryTimestamp = (period: TimerPeriod) => {
    const time = new Date()
    const minutes = currentMode === 'custom' 
      ? customTimes[period]
      : PRESETS[currentMode][period]
    time.setSeconds(time.getSeconds() + (minutes * 60))
    return time
  }

  const {
    seconds,
    minutes,
    isRunning: timerIsRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp: getExpiryTimestamp("work"),
    autoStart: false,
    onExpire: () => handleTimerComplete(),
  })

  useEffect(() => {
    if (isRunning !== timerIsRunning) {
      setIsRunning(timerIsRunning)
    }
  }, [timerIsRunning])

  const handleStart = () => {
    if (!isRunning) {
      if (timerIsRunning) {
        resume()
      } else {
        start()
      }
    } else {
      pause()
    }
  }

  const handleReset = () => {
    const time = getExpiryTimestamp(currentPeriod)
    restart(time, false)
    pause()
  }

  const handleSkip = () => {
    if (currentPeriod === 'work') {
      const newPomodoros = completedPomodoros + 1
      setCompletedPomodoros(newPomodoros)
      const nextPeriod = newPomodoros % 4 === 0 ? 'longBreak' : 'shortBreak'
      setCurrentPeriod(nextPeriod)
      const time = getExpiryTimestamp(nextPeriod)
      restart(time, isRunning)
    } else {
      setCurrentPeriod('work')
      const time = getExpiryTimestamp('work')
      restart(time, isRunning)
    }
  }

  const handleTimerComplete = () => {
    if (currentPeriod === 'work') {
      const newPomodoros = completedPomodoros + 1
      setCompletedPomodoros(newPomodoros)
      const nextPeriod = newPomodoros % 4 === 0 ? 'longBreak' : 'shortBreak'
      setCurrentPeriod(nextPeriod)
      const time = getExpiryTimestamp(nextPeriod)
      restart(time, isRunning)
    } else {
      setCurrentPeriod('work')
      const time = getExpiryTimestamp('work')
      restart(time, isRunning)
    }
  }

  const handleModeChange = (mode: TimerMode) => {
    const wasRunning = isRunning
    
    // Pause the timer first to prevent any race conditions
    pause()
    
    // Update the mode and period
    setCurrentMode(mode)
    setCurrentPeriod('work')
    
    if (mode === 'custom') {
      setShowCustomSettings(true)
      return
    }
    
    setShowCustomSettings(false)
    
    // Calculate the new expiry time directly using the preset values
    const newTime = new Date()
    newTime.setSeconds(newTime.getSeconds() + (PRESETS[mode].work * 60))
    
    // Update the timer with the new time
    if (wasRunning) {
      // If timer was running, restart it with the new times
      restart(newTime, true)
    } else {
      // If timer was stopped, just update the time but don't start it
      restart(newTime, false)
    }
    
    // Update both customTimes and inputValues to match the new preset
    setCustomTimes({
      work: PRESETS[mode].work,
      shortBreak: PRESETS[mode].shortBreak,
      longBreak: PRESETS[mode].longBreak,
    });
    
    setInputValues({
      work: PRESETS[mode].work.toString(),
      shortBreak: PRESETS[mode].shortBreak.toString(),
      longBreak: PRESETS[mode].longBreak.toString(),
    });
  }

  // Format time as MM:SS
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentTime = () => {
    if (currentMode === 'custom') {
      return customTimes[currentPeriod] * 60
    }
    return PRESETS[currentMode][currentPeriod] * 60
  }

  const getTimeRemaining = () => {
    return minutes * 60 + seconds
  }

  const getProgressPercentage = () => {
    // Only show progress when in work mode and timer is running
    if (currentPeriod === 'work' && isRunning) {
      const total = getCurrentTime()
      const remaining = getTimeRemaining()
      return ((total - remaining) / total) * 100
    }
    return 0 // No progress shown when not in work mode or timer is paused
  }
  return (
    <div className="bg-amber-50 w-[90%] lg:w-[60%] min-h-[500px] border-3 border-amber-800 shadow-neobrutal rounded-lg overflow-hidden">
      <div className="h-2 ${PRESETS[currentMode].color} w-full"></div>
      
      <div className="p-6">
        <h2 className="font-bold text-amber-800 text-4xl text-center mb-6">
          Pomodoro Timer
        </h2>
        
        {/* Mode Selector */}
        <div className="mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                ref={modeSelectorRef}
                className="w-full flex justify-between items-center rounded-lg bg-white border-2 border-amber-800 hover:bg-amber-100 text-amber-900"
                size={"lg"}
              >
                <span className="font-medium">{PRESETS[currentMode].label}</span>
                <ChevronDown className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white border-2 border-amber-800 rounded-lg shadow-neobrutal-sm mt-2"
              align="start"
            >
              <DropdownMenuLabel className="text-amber-800 font-semibold px-2">
                Timer Mode
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-amber-200 h-[1px] my-1" />
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={currentMode}
                  onValueChange={(value) => handleModeChange(value as TimerMode)}
                >
                  <DropdownMenuRadioItem
                    className="px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 focus:bg-amber-100 cursor-pointer"
                    value="moderate"
                  >
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      <span>Moderate ADHD (15-5-10)</span>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    className="px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 focus:bg-amber-100 cursor-pointer"
                    value="severe"
                  >
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                      <span>Severe ADHD (10-3-8)</span>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    className="px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 focus:bg-amber-100 cursor-pointer"
                    value="neurotypical"
                  >
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      <span>Neurotypical (25-5-15)</span>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    className="px-3 py-2 text-sm text-amber-900 hover:bg-amber-100 focus:bg-amber-100 cursor-pointer"
                    value="custom"
                  >
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                      <span>Custom Configuration</span>
                    </div>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="relative w-64 h-64 mx-auto mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Progress circle background */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-amber-200"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className={`${PRESETS[currentMode].color} transition-all duration-1000 ease-linear`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (getProgressPercentage() / 100) * 251.2}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <div className="text-5xl font-bold text-amber-900 mb-2">
                {formatTime(minutes, seconds)}
              </div>
              <div className="text-lg font-medium text-amber-700 capitalize">
                {currentPeriod === 'work' ? 'Focus Time' : currentPeriod === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </div>
              <div className="text-sm text-amber-600 mt-1">
                {currentMode === 'custom' 
                  ? `${customTimes.work}-${customTimes.shortBreak}-${customTimes.longBreak}` 
                  : `${PRESETS[currentMode].work}-${PRESETS[currentMode].shortBreak}-${PRESETS[currentMode].longBreak}`}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          <Button
            onClick={handleStart}
            className={`${isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'} text-white font-medium rounded-lg px-6 py-3 flex items-center`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReset}
            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg px-4 py-3 flex items-center border border-amber-300"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </Button>
          
          <Button
            onClick={handleSkip}
            className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg px-4 py-3 flex items-center border border-amber-300"
          >
            <SkipForward className="w-5 h-5 mr-2" />
            Skip
          </Button>
        </div>

        {/* Custom Settings */}
        {showCustomSettings && (
          <div className="mt-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">Custom Timer Settings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">Work (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={inputValues.work}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputValues(prev => ({...prev, work: value}));
                  }}
                  onBlur={(e) => {
                    const numValue = parseInt(e.target.value, 10);
                    if (isNaN(numValue) || numValue < 1) {
                      setInputValues(prev => ({...prev, work: '1'}));
                      setCustomTimes(prev => ({...prev, work: 1}));
                    } else if (numValue > 60) {
                      setInputValues(prev => ({...prev, work: '60'}));
                      setCustomTimes(prev => ({...prev, work: 60}));
                    } else {
                      setCustomTimes(prev => ({...prev, work: numValue}));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">Short Break (min)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={inputValues.shortBreak}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputValues(prev => ({...prev, shortBreak: value}));
                  }}
                  onBlur={(e) => {
                    const numValue = parseInt(e.target.value, 10);
                    if (isNaN(numValue) || numValue < 1) {
                      setInputValues(prev => ({...prev, shortBreak: '1'}));
                      setCustomTimes(prev => ({...prev, shortBreak: 1}));
                    } else if (numValue > 30) {
                      setInputValues(prev => ({...prev, shortBreak: '30'}));
                      setCustomTimes(prev => ({...prev, shortBreak: 30}));
                    } else {
                      setCustomTimes(prev => ({...prev, shortBreak: numValue}));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">Long Break (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={inputValues.longBreak}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputValues(prev => ({...prev, longBreak: value}));
                  }}
                  onBlur={(e) => {
                    const numValue = parseInt(e.target.value, 10);
                    if (isNaN(numValue) || numValue < 1) {
                      setInputValues(prev => ({...prev, longBreak: '1'}));
                      setCustomTimes(prev => ({...prev, longBreak: 1}));
                    } else if (numValue > 60) {
                      setInputValues(prev => ({...prev, longBreak: '60'}));
                      setCustomTimes(prev => ({...prev, longBreak: 60}));
                    } else {
                      setCustomTimes(prev => ({...prev, longBreak: numValue}));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => {
                  setShowCustomSettings(false)
                  // Reset timer with new custom times
                  const time = getExpiryTimestamp(currentPeriod)
                  restart(time, isRunning)
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg px-4 py-2"
              >
                Apply Settings
              </Button>
            </div>
          </div>
        )}

        {/* Pomodoro Counter */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center px-4 py-2 bg-amber-100 rounded-full">
            <span className="text-amber-800 font-medium">
              Pomodoros: <span className="font-bold">{completedPomodoros}</span>
            </span>
            {completedPomodoros > 0 && (
              <button
                onClick={() => setCompletedPomodoros(0)}
                className="ml-2 text-amber-600 hover:text-amber-800"
                title="Reset counter"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Global styles for the progress ring animation
const ProgressRingStyles = () => (
  <style jsx global>{
    `@keyframes countdown {
      from {
        stroke-dashoffset: 0;
      }
    }
    
    .progress-ring__circle {
      transition: stroke-dashoffset 0.35s;
      transform: rotate(-90deg);
      transform-origin: 50% 50%;
    }
    .mode-selector {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `}</style>
)

export default PomodoroTimer
