"use client";

import { Save, Clock, User, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ClinicalNote {
  id: string;
  content: string;
  type: "subjective" | "objective" | "assessment" | "plan";
  author: string;
  timestamp: string;
}

export function ClinicalNotesComponent() {
  const [notes, setNotes] = useState<ClinicalNote[]>([
    {
      id: "1",
      content: "Patient presents with persistent headache and fatigue. Reports difficulty sleeping.",
      type: "subjective",
      author: "Dr. Sarah Johnson",
      timestamp: "2024-03-20 10:30 AM"
    },
    {
      id: "2",
      content: "BP: 128/82, HR: 72, Temp: 36.8°C. No visible distress. Neurological exam normal.",
      type: "objective",
      author: "Dr. Sarah Johnson",
      timestamp: "2024-03-20 10:35 AM"
    }
  ]);

  const [newNote, setNewNote] = useState({
    content: "",
    type: "subjective" as "subjective" | "objective" | "assessment" | "plan"
  });

  const addNote = () => {
    if (newNote.content.trim()) {
      const note: ClinicalNote = {
        id: Date.now().toString(),
        content: newNote.content,
        type: newNote.type,
        author: "Dr. Sarah Johnson",
        timestamp: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setNotes([...notes, note]);
      setNewNote({ content: "", type: "subjective" });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subjective": return "bg-purple-100 text-purple-700";
      case "objective": return "bg-blue-100 text-blue-700";
      case "assessment": return "bg-emerald-100 text-emerald-700";
      case "plan": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "subjective": return "S - Subjective";
      case "objective": return "O - Objective";
      case "assessment": return "A - Assessment";
      case "plan": return "P - Plan";
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Clinical Notes (SOAP)</h2>
        <div className="text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Auto-save enabled
        </div>
      </div>

      {/* SOAP Guide */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">SOAP Format Guide</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-700">Subjective</p>
            <p className="text-xs text-purple-600 mt-1">Patient's symptoms & history</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Objective</p>
            <p className="text-xs text-blue-600 mt-1">Examination findings & vitals</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-sm font-medium text-emerald-700">Assessment</p>
            <p className="text-xs text-emerald-600 mt-1">Diagnosis & differentials</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-sm font-medium text-amber-700">Plan</p>
            <p className="text-xs text-amber-600 mt-1">Treatment & follow-up</p>
          </div>
        </div>
      </div>

      {/* New Note Input */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Note Type:</span>
            <div className="flex gap-2">
              {["subjective", "objective", "assessment", "plan"].map((type) => (
                <button
                  key={type}
                  onClick={() => setNewNote({...newNote, type: type as any})}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    newNote.type === type
                      ? getTypeColor(type)
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(newNote.type)}`}>
            {getTypeLabel(newNote.type)}
          </div>
        </div>

        <textarea
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder={`Enter ${newNote.type} note here...`}
          value={newNote.content}
          onChange={(e) => setNewNote({...newNote, content: e.target.value})}
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {newNote.content.length}/2000 characters
          </div>
          <button
            onClick={addNote}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            disabled={!newNote.content.trim()}
          >
            <Save className="w-4 h-4" />
            Add Note
          </button>
        </div>
      </div>

      {/* Notes Timeline */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Notes History</h3>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No clinical notes yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getTypeColor(note.type)}`}>
                      {getTypeLabel(note.type)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{note.author}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{note.timestamp}</span>
                  </div>
                </div>
                <p className="text-gray-700 mt-3">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {notes.length} note{notes.length !== 1 ? 's' : ''} in chart
          </div>
          <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition">
            Sign & Lock Notes
          </button>
        </div>
      </div>
    </div>
  );
}