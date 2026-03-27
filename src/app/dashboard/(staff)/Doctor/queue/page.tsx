"use client";

import { useState, useEffect, useRef } from "react";
import {
  Volume2,
  SkipForward,
  Pause,
  Play,
  User,
  Clock,
  Bell,
  CheckCircle,
  MoreVertical,
  Phone,
  Headphones,
  AlertCircle,
  RotateCcw,
  X,
  ChevronRight,
  ChevronLeft,
  Mic,
  Speaker
} from "lucide-react";

// Mock patient queue data
const initialQueue = [
  {
    id: 1,
    name: "Usman Abubakar Kanawa",
    number: "P001",
    reason: "Annual Checkup",
    waitTime: "15 mins",
    status: "waiting",
    priority: "normal",
    timeAdded: "09:00 AM"
  },
  {
    id: 2,
    name: "Lisa Park",
    number: "P002",
    reason: "Hypertension Follow-up",
    waitTime: "22 mins",
    status: "waiting",
    priority: "high",
    timeAdded: "09:15 AM"
  },
  {
    id: 3,
    name: "David Miller",
    number: "P003",
    reason: "Flu Symptoms",
    waitTime: "30 mins",
    status: "waiting",
    priority: "normal",
    timeAdded: "09:30 AM"
  },
  {
    id: 4,
    name: "Sarah Johnson",
    number: "P004",
    reason: "Diabetes Consultation",
    waitTime: "45 mins",
    status: "waiting",
    priority: "normal",
    timeAdded: "09:45 AM"
  },
  {
    id: 5,
    name: "Michael Chen",
    number: "P005",
    reason: "Chest Pain",
    waitTime: "50 mins",
    status: "waiting",
    priority: "emergency",
    timeAdded: "10:00 AM"
  },
  {
    id: 6,
    name: "Emma Rodriguez",
    number: "P006",
    reason: "Vaccination",
    waitTime: "55 mins",
    status: "waiting",
    priority: "normal",
    timeAdded: "10:15 AM"
  },
];

// Mock doctors
const doctors = [
  { id: 1, name: "Dr. Smith", room: "Consultation Room 1" },
  { id: 2, name: "Dr. Johnson", room: "Consultation Room 2" },
  { id: 3, name: "Dr. Williams", room: "Emergency Room" },
];

// Voice settings
const voices = [
  { id: 'en-US-1', name: 'US English Male', lang: 'en-US', rate: 1 },
  { id: 'en-US-2', name: 'US English Female', lang: 'en-US', rate: 0.9 },
  { id: 'en-GB', name: 'British English', lang: 'en-GB', rate: 1 },
];

interface Patient {
  id: number;
  name: string;
  number: string;
  reason: string;
  waitTime: string;
  status: string;
  priority: string;
  timeAdded: string;
}

export default function PatientQueueSystem() {
  const [queue, setQueue] = useState<Patient[]>(initialQueue);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [calledPatients, setCalledPatients] = useState<Patient[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]);
  const [announcementText, setAnnouncementText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [speechRate, setSpeechRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [autoCall, setAutoCall] = useState(false);
  const [callInterval, setCallInterval] = useState(30); // seconds
  const [showSettings, setShowSettings] = useState(false);

  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const autoCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesisRef.current = window.speechSynthesis;

    // Cleanup on unmount
    return () => {
      if (speechSynthesisRef.current?.speaking) {
        speechSynthesisRef.current.cancel();
      }
      if (autoCallTimerRef.current) {
        clearInterval(autoCallTimerRef.current);
      }
    };
  }, []);

  // Auto-call functionality
  useEffect(() => {
    if (autoCallTimerRef.current) {
      clearInterval(autoCallTimerRef.current);
    }

    if (autoCall && queue.length > 0) {
      autoCallTimerRef.current = setInterval(() => {
        callNextPatient();
      }, callInterval * 1000);
    }

    return () => {
      if (autoCallTimerRef.current) {
        clearInterval(autoCallTimerRef.current);
      }
    };
  }, [autoCall, callInterval, queue]);

  const speak = (text: any) => {
    const synth = speechSynthesisRef.current;
    if (!synth) return;

    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.volume = volume;
    utterance.lang = selectedVoice.lang;

    // Try to set voice
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang === selectedVoice.lang);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    const synth = speechSynthesisRef.current;
    if (synth?.speaking) {
      synth.cancel();
      setIsSpeaking(false);
    }
  };

  const callNextPatient = () => {
    if (queue.length === 0) return;

    const nextPatient = queue[0];
    setCurrentPatient(nextPatient);

    // Move patient from queue to called
    setQueue(prev => prev.filter(p => p.id !== nextPatient.id));
    setCalledPatients(prev => [nextPatient, ...prev]);

    // Create announcement message
    const announcement = `Patient ${nextPatient.name}, please proceed to ${selectedDoctor.room}. Your consultation number is ${nextPatient.number}.`;
    setAnnouncementText(announcement);

    // Speak the announcement
    speak(announcement);
  };

  const callSpecificPatient = (patient: any) => {
    setCurrentPatient(patient);

    // Move patient from queue to called
    setQueue(prev => prev.filter(p => p.id !== patient.id));
    setCalledPatients(prev => [patient, ...prev]);

    const announcement = `Patient ${patient.name}, please proceed to ${selectedDoctor.room}. Your consultation number is ${patient.number}.`;
    setAnnouncementText(announcement);
    speak(announcement);
  };

  const repeatAnnouncement = () => {
    if (announcementText) {
      speak(announcementText);
    }
  };

  const addToQueue = () => {
    const newPatient = {
      id: queue.length + calledPatients.length + 1,
      name: `New Patient ${queue.length + calledPatients.length + 1}`,
      number: `P${(queue.length + calledPatients.length + 1).toString().padStart(3, '0')}`,
      reason: "General Consultation",
      waitTime: `${Math.floor(Math.random() * 60)} mins`,
      status: "waiting",
      priority: "normal",
      timeAdded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setQueue(prev => [...prev, newPatient]);
  };

  const removePatient = (patientId: number) => {
    setQueue(prev => prev.filter(p => p.id !== patientId));
  };

  const markAsCompleted = (patientId: number) => {
    setCalledPatients(prev =>
      prev.map(p => p.id === patientId ? { ...p, status: 'completed' } : p)
    );
  };

  const resetQueue = () => {
    setQueue(initialQueue);
    setCalledPatients([]);
    setCurrentPatient(null);
    setAnnouncementText("");
    stopSpeaking();
  };

  const getPriorityColor = (priority: any) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Patient Queue System</h1>
            <p className="text-gray-600 mt-1">Manage and announce patient consultations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetQueue}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Queue
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Headphones className="h-4 w-4" />
              Voice Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Queue Management */}
        <div className="lg:col-span-8 space-y-6">
          {/* Announcement Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Volume2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Announcement System</h2>
                  <p className="text-sm text-gray-500">Currently calling patients to consultation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={repeatAnnouncement}
                    disabled={!announcementText}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Repeat
                  </button>
                )}
              </div>
            </div>

            {currentPatient ? (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Currently Calling</h3>
                        <p className="text-lg font-semibold text-blue-700">{currentPatient.name} - {currentPatient.number}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-12">{announcementText}</p>
                  </div>
                  <button
                    onClick={repeatAnnouncement}
                    className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Volume2 className="h-5 w-5 text-blue-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-500">No patient is currently being called</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
                <select
                  value={selectedDoctor.id}
                  onChange={(e) => {
                    const doctor = doctors.find(d => d.id === parseInt(e.target.value, 10));
                    if (doctor) setSelectedDoctor(doctor);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.room}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-call Interval</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoCall}
                      onChange={(e) => setAutoCall(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Auto-call</span>
                  </div>
                  <select
                    value={callInterval}
                    onChange={(e) => setCallInterval(parseInt(e.target.value))}
                    disabled={!autoCall}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    <option value={15}>Every 15 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every minute</option>
                    <option value={120}>Every 2 minutes</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={callNextPatient}
                  disabled={queue.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SkipForward className="h-5 w-5" />
                  Call Next Patient
                </button>
              </div>
            </div>
          </div>

          {/* Current Queue */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Waiting Queue</h2>
                  <p className="text-sm text-gray-500">{queue.length} patients waiting</p>
                </div>
              </div>
              <button
                onClick={addToQueue}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                + Add Patient
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Queue No.</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reason</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Wait Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Priority</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {queue.map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-lg font-bold text-gray-900">{patient.number}</div>
                        <div className="text-xs text-gray-500">{patient.timeAdded}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{patient.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">{patient.reason}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{patient.waitTime}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(patient.priority)}`}>
                          {patient.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => callSpecificPatient(patient)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            Call Now
                          </button>
                          <button
                            onClick={() => removePatient(patient.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {queue.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No patients in the waiting queue</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Called Patients & Settings */}
        <div className="lg:col-span-4 space-y-6">
          {/* Voice Settings Panel */}
          {showSettings && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900">Voice Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voice Selection</label>
                  <select
                    value={selectedVoice.id}
                    onChange={(e) => {
                      const voice = voices.find(v => v.id === e.target.value);
                      if (voice) setSelectedVoice(voice);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {voices.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speech Rate: {speechRate.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {Math.round(volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Quiet</span>
                    <span>Loud</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => speak("Testing voice settings. This is a test announcement.")}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Speaker className="h-5 w-5" />
                    Test Voice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Called Patients */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Called Patients</h2>
                  <p className="text-sm text-gray-500">{calledPatients.length} patients called</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {calledPatients.map(patient => (
                <div key={patient.id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{patient.name}</h3>
                        <p className="text-xs text-gray-500">{patient.number}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => markAsCompleted(patient.id)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Complete
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{patient.reason}</span>
                    <span>Called to {selectedDoctor.room}</span>
                  </div>
                </div>
              ))}

              {calledPatients.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2" />
                  <p>No patients called yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Queue Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Waiting</span>
                <span className="font-bold">{queue.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Called Today</span>
                <span className="font-bold">{calledPatients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Wait Time</span>
                <span className="font-bold">24 mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Doctor</span>
                <span className="font-bold">{selectedDoctor.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="mt-8 p-4 bg-gray-900 text-white rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              {isSpeaking ? (
                <Speaker className="h-5 w-5 text-blue-400 animate-pulse" />
              ) : (
                <Volume2 className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {isSpeaking ? "Currently announcing..." : "System ready"}
              </p>
              <p className="text-sm text-gray-300">
                {isSpeaking
                  ? `Calling: ${currentPatient?.name || 'Patient'} to ${selectedDoctor.room}`
                  : "Click 'Call Next Patient' to begin"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-300">Auto-call</p>
              <p className="font-medium">{autoCall ? `ON (every ${callInterval}s)` : "OFF"}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}