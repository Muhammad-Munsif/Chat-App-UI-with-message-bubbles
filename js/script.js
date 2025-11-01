document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const messageForm = document.getElementById("send-message");
  const messageInput = document.getElementById("message-text");
  const backButton = document.getElementById("back-button");
  const contactsSidebar = document.getElementById("contacts-sidebar");
  const contactItems = document.querySelectorAll(".contact-item");

  // Sample data for demonstration
  const sampleMessages = [
    {
      text: "That was in the mountains near Aspen!",
      incoming: true,
      time: "10:38 AM",
    },
    {
      text: "I'm planning to go back next month",
      incoming: true,
      time: "10:39 AM",
    },
    {
      text: "Sounds like a great plan! Maybe I can join you?",
      incoming: false,
      time: "10:40 AM",
    },
    {
      text: "That would be awesome! Let me know your dates.",
      incoming: true,
      time: "10:41 AM",
    },
  ];

  // Initialize the chat
  initChat();

  // Event Listeners
  messageForm.addEventListener("submit", sendMessage);
  backButton.addEventListener("click", toggleSidebar);

  // Add click event to contact items
  contactItems.forEach((contact) => {
    contact.addEventListener("click", function () {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
      // In a real app, you would load the chat for this contact
    });
  });

  // Functions
  function initChat() {
    // Add sample messages after a delay to simulate chat history
    setTimeout(() => {
      sampleMessages.forEach((msg, index) => {
        setTimeout(() => {
          addMessage(msg.text, msg.incoming, msg.time);
          scrollToBottom();
        }, index * 300);
      });
    }, 1000);
  }

  function sendMessage(e) {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (message === "") return;

    // Add outgoing message
    addMessage(message, false, getCurrentTime());
    scrollToBottom();

    // Clear input
    messageInput.value = "";

    // Simulate reply after a delay
    setTimeout(() => {
      addMessage(
        "Thanks for your message! I'll get back to you soon.",
        true,
        getCurrentTime()
      );
      scrollToBottom();

      // Show typing indicator
      const typingIndicator = document.createElement("div");
      typingIndicator.className = "flex mb-4 typing-indicator";
      typingIndicator.innerHTML = `
                <div class="flex-shrink-0 mr-3">
                    <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">JD</div>
                </div>
                <div class="bg-gray-200 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
                    </div>
                </div>
            `;
      chatMessages.appendChild(typingIndicator);
      scrollToBottom();

      // Remove typing indicator after delay and add another message
      setTimeout(() => {
        chatMessages.removeChild(typingIndicator);
        addMessage(
          "By the way, did you see the new updates to the project?",
          true,
          getCurrentTime()
        );
        scrollToBottom();
      }, 2000);
    }, 1000);
  }

  function addMessage(text, incoming, time) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `flex mb-4 ${incoming ? "" : "justify-end"} message`;

    if (incoming) {
      messageDiv.innerHTML = `
                <div class="flex-shrink-0 mr-3">
                    <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">JD</div>
                </div>
                <div class="flex flex-col items-start">
                    <div class="bg-gray-200 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none max-w-xs">
                        ${text}
                    </div>
                    <span class="text-xs text-gray-500 mt-1">${time}</span>
                </div>
            `;
    } else {
      messageDiv.innerHTML = `
                <div class="flex flex-col items-end">
                    <div class="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-xs">
                        ${text}
                    </div>
                    <span class="text-xs text-gray-500 mt-1">${time} <i class="fas fa-check-double ml-1 text-indigo-400"></i></span>
                </div>
            `;
    }

    chatMessages.appendChild(messageDiv);
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  }

  function toggleSidebar() {
    contactsSidebar.classList.toggle("hidden");
    contactsSidebar.classList.toggle("active");
  }

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      contactsSidebar.classList.remove("hidden");
      contactsSidebar.classList.remove("active");
    }
  });
});
