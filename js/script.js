
    (function () {
      // ==================== WEBRTC CONFIGURATION ====================
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      };

      // ==================== STATE MANAGEMENT ====================
      let currentChatId = null;
      let currentUser = null;
      let isMobile = window.innerWidth < 768;
      let isDark = localStorage.getItem('theme') === 'dark';

      // Mute states
      let isNotificationMuted = localStorage.getItem('notificationMute') === 'true';
      let isCallMuted = false;
      let isVideoEnabled = true;
      let isSpeakerMuted = false;
      let isRecording = false;
      let mediaRecorder = null;
      let recordedChunks = [];

      // WebRTC variables
      let localStream = null;
      let remoteStream = null;
      let peerConnection = null;
      let currentCallType = null;
      let isCallActive = false;

      // Call timer
      let callTimer = null;
      let callSeconds = 0;

      // Demo users data
      const users = [
        { id: 1, name: "John Doe", avatarIcon: "user-tie", status: "online", lastSeen: "just now", lastMessage: "Hey there!", unread: 0, phone: "+1 (555) 111-2222", email: "john@example.com" },
        { id: 2, name: "Alice Smith", avatarIcon: "user-graduate", status: "online", lastSeen: "2 min ago", lastMessage: "Meeting at 3pm?", unread: 3, phone: "+1 (555) 222-3333", email: "alice@example.com" },
        { id: 3, name: "Mike Johnson", avatarIcon: "user-ninja", status: "away", lastSeen: "30 min", lastMessage: "Project files", unread: 0, phone: "+1 (555) 333-4444", email: "mike@example.com" },
        { id: 4, name: "Sarah Brown", avatarIcon: "user-astronaut", status: "offline", lastSeen: "2 hours", lastMessage: "Thanks!", unread: 1, phone: "+1 (555) 444-5555", email: "sarah@example.com" }
      ];

      const chatMessages = {
        1: [{ id: 1, type: "text", content: "Hey! How are you?", incoming: true, time: "10:30 AM" }],
        2: [{ id: 1, type: "text", content: "Hi Alice!", incoming: false, time: "9:15 AM" }],
        3: [{ id: 1, type: "text", content: "Project files are ready", incoming: true, time: "Yesterday" }],
        4: [{ id: 1, type: "text", content: "Thanks for your help!", incoming: false, time: "2 hours ago" }]
      };

      // DOM elements
      const els = {
        body: document.body,
        sidebar: document.getElementById('sidebar'),
        overlay: document.getElementById('overlay'),
        themeToggle: document.getElementById('themeToggle'),
        onlineUsers: document.getElementById('onlineUsers'),
        conversationsList: document.getElementById('conversationsList'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        chatMessages: document.getElementById('chatMessages'),
        messagesContainer: document.getElementById('messagesContainer'),
        currentUserName: document.getElementById('currentUserName'),
        currentUserAvatar: document.getElementById('currentUserAvatar'),
        currentUserStatus: document.getElementById('currentUserStatus'),
        currentUserStatusText: document.getElementById('currentUserStatusText'),
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendButton'),
        attachmentMenu: document.getElementById('attachmentMenu'),
        searchInput: document.getElementById('searchInput'),
        onlineCount: document.getElementById('onlineCount'),
        photoInput: document.getElementById('photoInput'),
        fileInput: document.getElementById('fileInput'),

        // Incoming call modal
        incomingCallModal: document.getElementById('incomingCallModal'),
        incomingCallAvatar: document.getElementById('incomingCallAvatar'),
        incomingCallName: document.getElementById('incomingCallName'),
        incomingCallType: document.getElementById('incomingCallType'),

        // Call modal elements
        callModal: document.getElementById('callModal'),
        callUserName: document.getElementById('callUserName'),
        callUserAvatar: document.getElementById('callUserAvatar'),
        callStatus: document.getElementById('callStatus'),
        localVideo: document.getElementById('localVideo'),
        remoteVideo: document.getElementById('remoteVideo'),
        remoteVideoLabel: document.getElementById('remoteVideoLabel'),
        localVideoQuality: document.getElementById('localVideoQuality'),
        remoteVideoQuality: document.getElementById('remoteVideoQuality'),
        callMuteBtn: document.getElementById('callMuteBtn'),
        callVideoBtn: document.getElementById('callVideoBtn'),
        callSpeakerBtn: document.getElementById('callSpeakerBtn'),
        cameraSwitchBtn: document.getElementById('cameraSwitchBtn'),
        screenShareBtn: document.getElementById('screenShareBtn'),
        recordBtn: document.getElementById('recordBtn'),
        callTimer: document.getElementById('callTimer'),

        // Profile modal
        profileModal: document.getElementById('profileModal'),
        profileName: document.getElementById('profileName'),
        profileStatus: document.getElementById('profileStatus'),
        profileAvatar: document.getElementById('profileAvatar'),
        notificationMuteToggle: document.getElementById('notificationMuteToggle'),
        darkModeToggle: document.getElementById('darkModeToggle'),
        notificationIcon: document.getElementById('notificationIcon'),
        muteText: document.getElementById('muteText'),

        // Device selects
        audioInputSelect: document.getElementById('audioInputSelect'),
        videoInputSelect: document.getElementById('videoInputSelect'),
        audioOutputSelect: document.getElementById('audioOutputSelect')
      };

      // ==================== INITIALIZATION ====================
      function init() {
        loadOnlineUsers();
        loadConversations();
        setupTheme();
        setupEventListeners();
        enumerateDevices();
        updateNotificationMuteUI();
      }

      function setupTheme() {
        if (isDark) {
          els.body.setAttribute('data-theme', 'dark');
          els.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
          if (els.darkModeToggle) els.darkModeToggle.classList.add('active');
        }
      }

      function setupEventListeners() {
        els.themeToggle.addEventListener('click', toggleTheme);
        els.messageInput.addEventListener('input', () => {
          els.sendButton.disabled = !els.messageInput.value.trim();
        });
        els.messageInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && els.messageInput.value.trim()) sendMessage();
        });
        els.searchInput.addEventListener('input', filterConversations);

        els.photoInput.addEventListener('change', (e) => handleFileSelect(e.target, 'photo'));
        els.fileInput.addEventListener('change', (e) => handleFileSelect(e.target, 'file'));

        window.addEventListener('resize', () => {
          isMobile = window.innerWidth < 768;
          if (!isMobile) closeSidebar();
        });
      }

      // ==================== WEBRTC FUNCTIONS ====================
      async function createPeerConnection() {
        peerConnection = new RTCPeerConnection(configuration);

        // Add local stream tracks to peer connection
        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            // In real app, send this candidate to remote peer via signaling server
            console.log('ICE candidate:', event.candidate);
            simulateSignaling('candidate', event.candidate);
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log('Connection state:', peerConnection.connectionState);
          if (peerConnection.connectionState === 'connected') {
            els.callStatus.innerText = 'Connected';
            isCallActive = true;
          } else if (peerConnection.connectionState === 'disconnected' ||
            peerConnection.connectionState === 'failed') {
            if (isCallActive) {
              showToast('❌ Call disconnected');
              endCall();
            }
          }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          if (!remoteStream) {
            remoteStream = new MediaStream();
          }
          event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
          });

          if (els.remoteVideo) {
            els.remoteVideo.srcObject = remoteStream;
          }

          // Update quality indicator (simulated)
          updateVideoQuality();
        };

        return peerConnection;
      }

      async function startAudioCall() {
        if (!currentUser) {
          alert('Please select a chat first');
          return;
        }

        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });

          currentCallType = 'audio';
          await initializeCall('audio');

        } catch (err) {
          alert('Microphone access denied. Please check permissions.');
          console.error(err);
        }
      }

      async function startVideoCall() {
        if (!currentUser) {
          alert('Please select a chat first');
          return;
        }

        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }
          });

          currentCallType = 'video';
          await initializeCall('video');

        } catch (err) {
          alert('Camera/microphone access denied. Please check permissions.');
          console.error(err);
        }
      }

      async function initializeCall(type) {
        await createPeerConnection();

        // Show incoming call modal to simulate receiving call
        showIncomingCall(currentUser, type);

        // In real app, you would send offer to remote peer
        setTimeout(() => {
          // Simulate accepting call after 3 seconds
          if (confirm(`Accept ${type} call from ${currentUser.name}?`)) {
            acceptCall();
          } else {
            declineCall();
          }
        }, 3000);
      }

      function showIncomingCall(user, type) {
        els.incomingCallAvatar.innerHTML = `<i class="fas fa-${user.avatarIcon}"></i>`;
        els.incomingCallName.innerText = user.name;
        els.incomingCallType.innerText = `Incoming ${type} call...`;
        els.incomingCallModal.classList.add('active');

        // Play ringtone (simulated)
        playRingtone();
      }

      function playRingtone() {
        // Simulate ringtone with beep
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        audio.play().catch(() => { });
      }

      async function acceptCall() {
        els.incomingCallModal.classList.remove('active');

        try {
          // Create offer
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: currentCallType === 'video'
          });
          await peerConnection.setLocalDescription(offer);

          // In real app, send offer to remote peer
          simulateSignaling('offer', offer);

          showCallModal(currentCallType);
          setupLocalStream();

        } catch (err) {
          console.error('Error accepting call:', err);
        }
      }

      function declineCall() {
        els.incomingCallModal.classList.remove('active');
        showToast('❌ Call declined');

        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
          localStream = null;
        }
      }

      function simulateSignaling(type, data) {
        // Simulate signaling server response
        setTimeout(async () => {
          if (type === 'offer') {
            // Simulate receiving answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Simulate remote description set
            const remoteDesc = new RTCSessionDescription(offer);
            await peerConnection.setRemoteDescription(remoteDesc);

          } else if (type === 'candidate') {
            // Simulate receiving remote ICE candidate
            await peerConnection.addIceCandidate(data);
          }
        }, 1000);
      }

      function showCallModal(type) {
        els.callUserName.innerText = currentUser.name;
        els.callUserAvatar.innerHTML = `<i class="fas fa-${currentUser.avatarIcon}"></i>`;
        els.callStatus.innerText = 'Connecting...';

        // Show/hide video elements
        document.getElementById('localVideoContainer').style.display = type === 'video' ? 'block' : 'none';
        document.getElementById('remoteVideoContainer').style.display = type === 'video' ? 'block' : 'none';

        // Reset mute states
        isCallMuted = false;
        isVideoEnabled = true;
        isSpeakerMuted = false;

        // Reset button icons
        updateCallButtonIcons();

        els.callModal.classList.add('active');
        startCallTimer();
      }

      function updateCallButtonIcons() {
        if (els.callMuteBtn) {
          const muteIcon = els.callMuteBtn.querySelector('i');
          muteIcon.className = 'fas fa-microphone';
          els.callMuteBtn.classList.remove('muted');
        }

        if (els.callVideoBtn) {
          const videoIcon = els.callVideoBtn.querySelector('i');
          videoIcon.className = 'fas fa-video';
          els.callVideoBtn.classList.remove('muted');
        }

        if (els.callSpeakerBtn) {
          const speakerIcon = els.callSpeakerBtn.querySelector('i');
          speakerIcon.className = 'fas fa-volume-up';
          els.callSpeakerBtn.classList.remove('muted');
        }
      }

      function setupLocalStream() {
        if (els.localVideo && localStream) {
          els.localVideo.srcObject = localStream;

          // Update quality indicator
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            const quality = settings.width >= 1280 ? 'HD' : 'SD';
            els.localVideoQuality.innerText = quality;
          }
        }
      }

      function updateVideoQuality() {
        // Simulate quality changes
        const qualities = ['HD', 'Full HD', 'SD'];
        setInterval(() => {
          if (isCallActive && currentCallType === 'video') {
            const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
            els.remoteVideoQuality.innerText = randomQuality;
          }
        }, 5000);
      }

      // ==================== CALL CONTROL FUNCTIONS ====================
      function toggleCallMute() {
        if (localStream) {
          const audioTracks = localStream.getAudioTracks();
          if (audioTracks.length > 0) {
            isCallMuted = !isCallMuted;
            audioTracks.forEach(track => track.enabled = !isCallMuted);

            const icon = els.callMuteBtn.querySelector('i');
            if (isCallMuted) {
              icon.className = 'fas fa-microphone-slash';
              els.callMuteBtn.classList.add('muted');
              els.callMuteBtn.title = 'Unmute microphone';
              showToast('🎤 Microphone muted');
            } else {
              icon.className = 'fas fa-microphone';
              els.callMuteBtn.classList.remove('muted');
              els.callMuteBtn.title = 'Mute microphone';
              showToast('🎤 Microphone unmuted');
            }
          }
        }
      }

      function toggleCallVideo() {
        if (localStream && currentCallType === 'video') {
          const videoTracks = localStream.getVideoTracks();
          if (videoTracks.length > 0) {
            isVideoEnabled = !isVideoEnabled;
            videoTracks.forEach(track => track.enabled = isVideoEnabled);

            const icon = els.callVideoBtn.querySelector('i');
            if (!isVideoEnabled) {
              icon.className = 'fas fa-video-slash';
              els.callVideoBtn.classList.add('muted');
              els.callVideoBtn.title = 'Turn on camera';
            } else {
              icon.className = 'fas fa-video';
              els.callVideoBtn.classList.remove('muted');
              els.callVideoBtn.title = 'Turn off camera';
            }
          }
        }
      }

      function toggleCallSpeaker() {
        isSpeakerMuted = !isSpeakerMuted;

        const icon = els.callSpeakerBtn.querySelector('i');
        if (isSpeakerMuted) {
          icon.className = 'fas fa-volume-mute';
          els.callSpeakerBtn.classList.add('muted');
          els.callSpeakerBtn.title = 'Unmute speaker';

          // Mute remote audio
          if (els.remoteVideo) {
            els.remoteVideo.volume = 0;
          }
        } else {
          icon.className = 'fas fa-volume-up';
          els.callSpeakerBtn.classList.remove('muted');
          els.callSpeakerBtn.title = 'Mute speaker';

          // Unmute remote audio
          if (els.remoteVideo) {
            els.remoteVideo.volume = 1;
          }
        }
      }

      async function toggleCamera() {
        if (!localStream || currentCallType !== 'video') return;

        try {
          const videoTracks = localStream.getVideoTracks();
          if (videoTracks.length > 0) {
            const currentFacingMode = videoTracks[0].getSettings().facingMode || 'user';
            const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

            const constraints = {
              video: {
                facingMode: newFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const newVideoTrack = newStream.getVideoTracks()[0];

            // Replace track in peer connection
            if (peerConnection) {
              const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
              if (sender) {
                sender.replaceTrack(newVideoTrack);
              }
            }

            videoTracks[0].stop();
            localStream.removeTrack(videoTracks[0]);
            localStream.addTrack(newVideoTrack);

            els.localVideo.srcObject = localStream;
            showToast('📷 Camera switched');
          }
        } catch (err) {
          console.error('Camera switch failed:', err);
          showToast('❌ Camera switch failed');
        }
      }

      async function shareScreen() {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });

          if (localStream && peerConnection) {
            const videoTrack = screenStream.getVideoTracks()[0];
            const audioTrack = screenStream.getAudioTracks()[0];

            // Replace video track in peer connection
            const videoSender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }

            // Add audio track if present
            if (audioTrack) {
              const audioSender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'audio');
              if (audioSender) {
                audioSender.replaceTrack(audioTrack);
              }
            }

            // Update local video
            els.localVideo.srcObject = screenStream;
            currentCallType = 'screen';

            videoTrack.onended = () => {
              // Restore camera when screen share ends
              if (currentUser) {
                startVideoCall();
              }
            };

            showToast('🖥️ Screen sharing started');
          }
        } catch (err) {
          console.error('Screen share failed:', err);
          showToast('❌ Screen share failed');
        }
      }

      function toggleRecording() {
        if (!localStream) return;

        if (!isRecording) {
          // Start recording
          recordedChunks = [];
          mediaRecorder = new MediaRecorder(localStream, {
            mimeType: 'video/webm;codecs=vp9'
          });

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `call-recording-${new Date().toISOString()}.webm`;
            a.click();
            showToast('💾 Recording saved');
          };

          mediaRecorder.start();
          isRecording = true;

          const icon = els.recordBtn.querySelector('i');
          icon.className = 'fas fa-stop';
          els.recordBtn.classList.add('danger');
          showToast('⏺️ Recording started');
        } else {
          // Stop recording
          mediaRecorder.stop();
          isRecording = false;

          const icon = els.recordBtn.querySelector('i');
          icon.className = 'fas fa-circle';
          els.recordBtn.classList.remove('danger');
        }
      }

      function endCall() {
        // Close peer connection
        if (peerConnection) {
          peerConnection.close();
          peerConnection = null;
        }

        // Stop local stream
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
          localStream = null;
        }

        // Clear video elements
        if (els.localVideo) els.localVideo.srcObject = null;
        if (els.remoteVideo) els.remoteVideo.srcObject = null;

        // Hide modals
        els.callModal.classList.remove('active');
        els.incomingCallModal.classList.remove('active');

        stopCallTimer();
        currentCallType = null;
        isCallActive = false;
        showToast('📞 Call ended');
      }

      function minimizeCall() {
        els.callModal.classList.remove('active');
        showToast('📱 Call minimized');

        // Show picture-in-picture (simulated)
        if (els.remoteVideo && currentCallType === 'video') {
          // In real app, implement PiP
          els.remoteVideo.style.position = 'fixed';
          els.remoteVideo.style.bottom = '20px';
          els.remoteVideo.style.right = '20px';
          els.remoteVideo.style.width = '300px';
          els.remoteVideo.style.height = '200px';
          els.remoteVideo.style.zIndex = '2000';
        }
      }

      // ==================== DEVICE MANAGEMENT ====================
      async function enumerateDevices() {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();

          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          els.audioInputSelect.innerHTML = audioInputs.map(d =>
            `<option value="${d.deviceId}">${d.label || 'Microphone'}</option>`
          ).join('');

          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          els.videoInputSelect.innerHTML = videoInputs.map(d =>
            `<option value="${d.deviceId}">${d.label || 'Camera'}</option>`
          ).join('');

          const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
          els.audioOutputSelect.innerHTML = audioOutputs.map(d =>
            `<option value="${d.deviceId}">${d.label || 'Speaker'}</option>`
          ).join('');
        } catch (err) {
          console.error('Device enumeration failed:', err);
        }
      }

      async function switchAudioInput(deviceId) {
        if (!localStream) return;

        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } }
          });

          const newAudioTrack = newStream.getAudioTracks()[0];
          const oldAudioTrack = localStream.getAudioTracks()[0];

          if (peerConnection) {
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'audio');
            if (sender) {
              sender.replaceTrack(newAudioTrack);
            }
          }

          localStream.removeTrack(oldAudioTrack);
          oldAudioTrack.stop();
          localStream.addTrack(newAudioTrack);

          showToast('🎤 Audio input switched');
        } catch (err) {
          console.error('Failed to switch audio input:', err);
        }
      }

      async function switchVideoInput(deviceId) {
        if (!localStream || currentCallType !== 'video') return;

        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } }
          });

          const newVideoTrack = newStream.getVideoTracks()[0];
          const oldVideoTrack = localStream.getVideoTracks()[0];

          if (peerConnection) {
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(newVideoTrack);
            }
          }

          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
          localStream.addTrack(newVideoTrack);

          els.localVideo.srcObject = localStream;
          showToast('📷 Camera switched');
        } catch (err) {
          console.error('Failed to switch video input:', err);
        }
      }

      function switchAudioOutput(deviceId) {
        // In real app, use setSinkId
        if (els.remoteVideo && els.remoteVideo.setSinkId) {
          els.remoteVideo.setSinkId(deviceId)
            .then(() => showToast('🔊 Audio output switched'))
            .catch(err => console.error('Failed to switch audio output:', err));
        }
      }

      // ==================== NOTIFICATION MUTE ====================
      function toggleNotificationMute() {
        isNotificationMuted = !isNotificationMuted;
        localStorage.setItem('notificationMute', isNotificationMuted);
        updateNotificationMuteUI();

        const message = isNotificationMuted ? '🔇 Notifications muted' : '🔔 Notifications unmuted';
        showToast(message);
      }

      function updateNotificationMuteUI() {
        if (els.notificationMuteToggle) {
          els.notificationMuteToggle.classList.toggle('active', isNotificationMuted);
        }
        if (els.notificationIcon) {
          els.notificationIcon.className = isNotificationMuted ? 'fas fa-bell-slash' : 'fas fa-bell';
        }
        if (els.muteText) {
          els.muteText.innerText = isNotificationMuted ? 'Unmute notifications' : 'Mute notifications';
        }
      }

      // ==================== USER & CONVERSATIONS ====================
      function loadOnlineUsers() {
        const online = users.filter(u => u.status === 'online');
        els.onlineCount.innerText = online.length;
        els.onlineUsers.innerHTML = '';
        online.forEach(u => {
          const div = document.createElement('div');
          div.className = 'flex flex-col items-center cursor-pointer transform hover:scale-110 transition';
          div.onclick = () => selectChat(u.id);
          div.innerHTML = `
            <div class="relative">
              <div class="avatar avatar-sm"><i class="fas fa-${u.avatarIcon}"></i></div>
              <span class="status-badge online"></span>
            </div>
            <span class="text-xs font-semibold mt-1 max-w-[60px] truncate">${u.name.split(' ')[0]}</span>
          `;
          els.onlineUsers.appendChild(div);
        });
      }

      function loadConversations() {
        els.conversationsList.innerHTML = '';
        users.forEach(u => {
          const div = document.createElement('div');
          div.className = `conv-item ${currentChatId === u.id ? 'active' : ''}`;
          div.setAttribute('data-userid', u.id);
          div.onclick = () => selectChat(u.id);
          div.innerHTML = `
            <div class="relative">
              <div class="avatar avatar-sm"><i class="fas fa-${u.avatarIcon}"></i></div>
              <span class="status-badge ${u.status}"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between">
                <span class="font-bold truncate">${u.name}</span>
                <span class="text-xs opacity-70">${u.lastSeen}</span>
              </div>
              <p class="text-sm opacity-70 truncate">${u.lastMessage}</p>
            </div>
            ${u.unread ? '<span class="bg-primary text-white text-xs rounded-full px-2 py-1">' + u.unread + '</span>' : ''}
          `;
          els.conversationsList.appendChild(div);
        });
      }

      function selectChat(id) {
        currentChatId = id;
        currentUser = users.find(u => u.id === id);
        if (!currentUser) return;

        els.currentUserName.innerText = currentUser.name;
        els.currentUserAvatar.innerHTML = `<i class="fas fa-${currentUser.avatarIcon}"></i>`;
        els.currentUserStatus.className = `status-badge ${currentUser.status}`;
        els.currentUserStatusText.innerText = currentUser.status === 'online' ? 'Online' : `Last seen ${currentUser.lastSeen}`;

        els.welcomeScreen.classList.add('hidden');
        els.chatMessages.classList.remove('hidden');
        els.messageInput.disabled = false;
        els.messageInput.placeholder = `Message ${currentUser.name}`;

        loadChatMessages();
        updateActive();
        if (isMobile) closeSidebar();
      }

      function loadChatMessages() {
        els.chatMessages.innerHTML = '';
        const msgs = chatMessages[currentChatId] || [];
        msgs.forEach(m => {
          const row = createMessageElement(m);
          els.chatMessages.appendChild(row);
        });
        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
      }

      function createMessageElement(m) {
        const row = document.createElement('div');
        row.className = `flex ${m.incoming ? '' : 'justify-end'} mb-4`;
        const bubble = document.createElement('div');
        bubble.className = `max-w-[70%] p-3 rounded-2xl ${m.incoming ? 'bg-surface' : 'bg-primary text-white'}`;
        bubble.innerHTML = `${m.content}<div class="text-xs opacity-70 mt-1">${m.time}</div>`;
        row.appendChild(bubble);
        return row;
      }

      function updateActive() {
        document.querySelectorAll('.conv-item').forEach(el => {
          const uid = el.getAttribute('data-userid');
          el.classList.toggle('active', Number(uid) === currentChatId);
        });
      }

      function filterConversations(e) {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.conv-item').forEach((item, idx) => {
          const user = users[idx];
          if (user) {
            const matches = user.name.toLowerCase().includes(term) ||
              user.lastMessage.toLowerCase().includes(term);
            item.style.display = matches || !term ? 'flex' : 'none';
          }
        });
      }

      function sendMessage() {
        if (!currentChatId || !els.messageInput.value.trim()) return;
        const text = els.messageInput.value.trim();
        const newMsg = { id: Date.now(), content: text, incoming: false, time: new Date().toLocaleTimeString() };

        const row = createMessageElement(newMsg);
        els.chatMessages.appendChild(row);
        els.messageInput.value = '';
        els.sendButton.disabled = true;
        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;

        setTimeout(() => {
          const reply = { id: Date.now(), content: 'Got it! 👍', incoming: true, time: new Date().toLocaleTimeString() };
          els.chatMessages.appendChild(createMessageElement(reply));
          els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;

          if (!isNotificationMuted) {
            showToast(`💬 New message from ${currentUser.name}`);
          }
        }, 1000);
      }

      // ==================== CALL TIMER ====================
      function startCallTimer() {
        callSeconds = 0;
        updateCallTimer();
        callTimer = setInterval(updateCallTimer, 1000);
      }

      function updateCallTimer() {
        callSeconds++;
        const mins = Math.floor(callSeconds / 60);
        const secs = callSeconds % 60;
        els.callTimer.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      function stopCallTimer() {
        if (callTimer) {
          clearInterval(callTimer);
          callTimer = null;
        }
      }

      // ==================== PROFILE FUNCTIONS ====================
      function showProfile() {
        els.profileName.innerText = 'Alex Morgan';
        els.profileStatus.innerText = 'Online';
        els.profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
        els.profileModal.classList.add('active');
      }

      function closeProfile() {
        els.profileModal.classList.remove('active');
      }

      function toggleDarkMode() {
        isDark = !isDark;
        els.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        els.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        els.darkModeToggle.classList.toggle('active', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
      }

      function logout() {
        if (confirm('Logout from WaveChat?')) {
          closeProfile();
          showToast('👋 Logged out successfully');
        }
      }

      function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce';
        toast.style.background = 'var(--primary-gradient)';
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }

      // ==================== UTILITIES ====================
      function toggleSidebar() {
        els.sidebar.classList.toggle('active');
        els.overlay.classList.toggle('active');
      }

      function closeSidebar() {
        els.sidebar.classList.remove('active');
        els.overlay.classList.remove('active');
      }

      function toggleTheme() {
        isDark = !isDark;
        els.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        els.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      }

      function toggleAttachmentMenu() {
        els.attachmentMenu.classList.toggle('hidden');
      }

      function toggleChatMenu() {
        showToast('Menu clicked');
      }

      function handleFileSelect(input, type) {
        const files = input.files;
        if (!files || files.length === 0 || !currentChatId) return;

        Array.from(files).forEach(file => {
          const newMsg = {
            id: Date.now() + Math.random(),
            content: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
            incoming: false,
            time: new Date().toLocaleTimeString()
          };
          els.chatMessages.appendChild(createMessageElement(newMsg));
        });

        els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
        input.value = '';
        showToast(`📎 ${files.length} file(s) uploaded`);
      }

      window.handlePhotoUpload = () => {
        els.attachmentMenu.classList.add('hidden');
        els.photoInput.click();
      };

      window.handleFileUpload = () => {
        els.attachmentMenu.classList.add('hidden');
        els.fileInput.click();
      };

      // Expose functions globally
      window.selectChat = selectChat;
      window.toggleSidebar = toggleSidebar;
      window.closeSidebar = closeSidebar;
      window.newChat = () => showToast('✨ New chat feature coming soon');
      window.showSettings = showProfile;
      window.startAudioCall = startAudioCall;
      window.startVideoCall = startVideoCall;
      window.acceptCall = acceptCall;
      window.declineCall = declineCall;
      window.toggleChatMenu = toggleChatMenu;
      window.toggleAttachmentMenu = toggleAttachmentMenu;
      window.viewProfile = showProfile;
      window.muteChat = toggleNotificationMute;
      window.clearChat = () => {
        if (confirm('Clear all messages?')) {
          els.chatMessages.innerHTML = '';
          showToast('🗑️ Chat cleared');
        }
      };
      window.exportChat = () => showToast('📥 Exporting chat...');
      window.sendMessage = sendMessage;
      window.showProfile = showProfile;
      window.closeProfile = closeProfile;
      window.toggleNotificationMute = toggleNotificationMute;
      window.toggleDarkMode = toggleDarkMode;
      window.logout = logout;
      window.toggleCallMute = toggleCallMute;
      window.toggleCallVideo = toggleCallVideo;
      window.toggleCallSpeaker = toggleCallSpeaker;
      window.toggleCamera = toggleCamera;
      window.shareScreen = shareScreen;
      window.toggleRecording = toggleRecording;
      window.endCall = endCall;
      window.minimizeCall = minimizeCall;
      window.switchAudioInput = switchAudioInput;
      window.switchVideoInput = switchVideoInput;
      window.switchAudioOutput = switchAudioOutput;

      // Initialize
      init();
    })();
  