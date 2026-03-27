'use client';

import { JitsiMeeting } from '@jitsi/react-sdk';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface VideoConferenceProps {
    roomName: string;
    displayName: string;
    email?: string;
    onClose?: () => void;
}

export default function VideoConference({ 
    roomName, 
    displayName, 
    email, 
    onClose 
}: VideoConferenceProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const handleReadyToClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.back();
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-gray-900">
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={roomName}
                configOverwrite={{
                    startWithAudioMuted: true,
                    disableDeepLinking: true,
                    bleDisableDeepLinking: true,
                    prejoinPageEnabled: false,
                    toolbarButtons: [
                        'camera',
                        'chat',
                        'closedcaptions',
                        'desktop',
                        'download',
                        'embedmeeting',
                        'etherpad',
                        'feedback',
                        'filmstrip',
                        'fullscreen',
                        'hangup',
                        'help',
                        'highlight',
                        'invite',
                        'linktosalesforce',
                        'livestreaming',
                        'microphone',
                        'noisesuppression',
                        'participants-pane',
                        'profile',
                        'raisehand',
                        'recording',
                        'security',
                        'select-background',
                        'settings',
                        'shareaudio',
                        'sharedvideo',
                        'shortcuts',
                        'stats',
                        'tileview',
                        'toggle-camera',
                        'videoquality',
                        'whiteboard',
                    ],
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                }}
                userInfo={{
                    displayName: displayName,
                    email: email || ''
                }}
                onApiReady={(externalApi) => {
                    setLoading(false);
                    // externalApi.on('videoConferenceLeft', handleReadyToClose);
                }}
                onReadyToClose={handleReadyToClose}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                }}
            />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            )}
        </div>
    );
}
