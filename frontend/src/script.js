// Dynamically load API Base URL from Vite Env Variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Nexora AI - Frontend Controller
// Core Logic, Markdown Parsing, State Management, Local Storage

// ----------------------------------------------------
// 1. Initial State & Configuration
// ----------------------------------------------------
let chatHistory = [];
let activeSubject = null; // null means General Mode
let isLoading = false;

const SUBJECT_DETAILS = {
  python: {
    name: 'Python Programming',
    assistant: 'Python Guru',
    badgeClass: 'badge-python',
    suggestions: [
      "Explain recursion in Python with an example",
      "Write Python code for binary search",
      "Explain list comprehensions vs loops in Python",
      "What is OOP in Python? Explain inheritance with code"
    ]
  },
  dbms: {
    name: 'DBMS & SQL',
    assistant: 'Database Expert',
    badgeClass: 'badge-dbms',
    suggestions: [
      "What is normalization in DBMS?",
      "What is indexing in databases?",
      "Explain Inner vs Outer Joins in SQL with examples",
      "What are ACID properties? Explain with database transactions"
    ]
  },
  os: {
    name: 'Operating Systems',
    assistant: 'OS Kernel Specialist',
    badgeClass: 'badge-os',
    suggestions: [
      "Explain process scheduling in OS",
      "Explain deadlock with a real-life example",
      "What is virtual memory and how does paging work?",
      "Compare Mutex and Semaphore with simple examples"
    ]
  },
  networks: {
    name: 'Computer Networks',
    assistant: 'Network Architect',
    badgeClass: 'badge-networks',
    suggestions: [
      "What is the TCP three-way handshake?",
      "Explain the 7 layers of the OSI reference model",
      "What is subnetting and how is a CIDR mask used?",
      "How does DNS lookup work step by step?"
    ]
  },
  dsa: {
    name: 'Data Structures (DSA)',
    assistant: 'DSA Master',
    badgeClass: 'badge-dsa',
    suggestions: [
      "Compare stack and queue data structures",
      "Compare Binary Search Tree vs Hash Map",
      "Explain time complexity and Big O notation",
      "Explain Binary Search algorithm with dry-run pseudo-code"
    ]
  }
};

// General Suggestions (fallback when no specific subject is selected)
const GENERAL_SUGGESTIONS = [
  "Explain recursion in Python with an example",
  "What is normalization in DBMS?",
  "Explain process scheduling in OS",
  "What is TCP three-way handshake?",
  "Compare stack and queue",
  "Write Python code for binary search",
  "Explain deadlock with real-life example",
  "What is indexing in databases?"
];

// ----------------------------------------------------
// 2. DOM Elements Selection
// ----------------------------------------------------
// Navigation Elements
const sidebar = document.getElementById('sidebar');
const mobileToggleBtn = document.getElementById('mobileToggleBtn');
const mobileCloseBtn = document.getElementById('mobileCloseBtn');
const navLinks = document.querySelectorAll('.nav-item');
const viewPanels = document.querySelectorAll('.view-panel');
const currentViewTitle = document.getElementById('currentViewTitle');
const subjectShortcuts = document.querySelectorAll('.shortcut-btn');

// Chat UI Elements
const currentAssistantName = document.getElementById('currentAssistantName');
const currentSubjectLabel = document.getElementById('currentSubjectLabel');
const chatEmptyState = document.getElementById('chatEmptyState');
const suggestionsGrid = document.getElementById('suggestionsGrid');
const messagesList = document.getElementById('messagesList');
const typingIndicator = document.getElementById('typingIndicator');
const chatInput = document.getElementById('chatInput');
const charCounter = document.getElementById('charCounter');
const sendMsgBtn = document.getElementById('sendMsgBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const clearChatBtnTop = document.getElementById('clearChatBtnTop');
const contentBody = document.getElementById('contentBody');
const messagesWindow = document.getElementById('messagesWindow');
const heroSection = document.getElementById('heroSection');
const subjectGridContainer = document.getElementById('subjectGridContainer');
const chatContainer = document.getElementById('chatContainer');
const heroStartBtn = document.getElementById('heroStartBtn');

// History Statistics
const statsTotalMessages = document.getElementById('statsTotalMessages');
const statsSavedSessions = document.getElementById('statsSavedSessions');
const statsLastActive = document.getElementById('statsLastActive');
const historyResetBtn = document.getElementById('historyResetBtn');

// Modals & Toast Elements
const toastContainer = document.getElementById('toastContainer');
const confirmModal = document.getElementById('confirmModal');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmOkBtn = document.getElementById('confirmOkBtn');

// ----------------------------------------------------
// 3. App Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadChatHistoryFromStorage();
  updateUIForHistory();
  renderSuggestions();
  setupEventListeners();
  
  // By default, if we have messages saved, hide the hero section and show the chat container.
  if (chatHistory.length > 0) {
    heroSection.style.display = 'none';
    subjectGridContainer.style.display = 'none';
    chatEmptyState.style.display = 'none';
    renderAllMessages();
    scrollToLatestMessage();
  } else {
    chatContainer.style.display = 'none';
  }
});

// ----------------------------------------------------
// 4. Local Storage & Stats Management
// ----------------------------------------------------
function saveChatHistoryToStorage() {
  localStorage.setItem('nexora_ai_history', JSON.stringify(chatHistory));
  updateUIForHistory();
}

function loadChatHistoryFromStorage() {
  const data = localStorage.getItem('nexora_ai_history');
  if (data) {
    try {
      chatHistory = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse localStorage history:', e);
      chatHistory = [];
    }
  }
}

function updateUIForHistory() {
  // Update stats page counts
  if (statsTotalMessages) {
    statsTotalMessages.textContent = chatHistory.length;
  }
  if (statsSavedSessions) {
    statsSavedSessions.textContent = chatHistory.length > 0 ? 1 : 0;
  }
  if (statsLastActive) {
    if (chatHistory.length > 0) {
      const lastMsg = chatHistory[chatHistory.length - 1];
      const date = new Date(lastMsg.timestamp);
      statsLastActive.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
    } else {
      statsLastActive.textContent = 'Never';
    }
  }
}

// ----------------------------------------------------
// 5. Event Listeners Setup
// ----------------------------------------------------
function setupEventListeners() {
  // Mobile Sidebar Toggles
  mobileToggleBtn.addEventListener('click', () => {
    sidebar.classList.add('mobile-open');
  });

  mobileCloseBtn.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
  });

  // Close sidebar on backdrop click (if screen width is mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !mobileToggleBtn.contains(e.target) && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });

  // Navigation Panel Views Swapper
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Close sidebar if open on mobile
      sidebar.classList.remove('mobile-open');
      
      const targetView = link.id.replace('nav', 'view');
      
      // Set active nav class
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Toggle view panels
      viewPanels.forEach(panel => {
        panel.classList.remove('active-panel');
        if (panel.id === targetView) {
          panel.classList.add('active-panel');
        }
      });

      // Update Header Title
      let titleText = 'Academic Dashboard';
      if (targetView === 'viewSubjects') titleText = 'Subject Specializations';
      if (targetView === 'viewHistory') titleText = 'Stored Sessions';
      if (targetView === 'viewTips') titleText = 'Exam Preparation Tips';
      currentViewTitle.textContent = titleText;
      
      // If we go back to chat, manage layouts
      if (targetView === 'viewChat') {
        if (chatHistory.length > 0) {
          chatContainer.style.display = 'flex';
          heroSection.style.display = 'none';
          subjectGridContainer.style.display = 'none';
          scrollToLatestMessage();
        } else {
          chatContainer.style.display = 'none';
          heroSection.style.display = 'block';
          subjectGridContainer.style.display = 'block';
        }
      }
    });
  });

  // Subject Shortcuts Sidebar Clicks
  subjectShortcuts.forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = btn.dataset.subject;
      selectSubject(subject);
      
      // Activate chat view
      document.getElementById('navChat').click();
      
      // Focus input field
      chatInput.focus();
    });
  });

  // Subject Cards Grid Clicks (Hero page)
  document.querySelectorAll('.subject-card').forEach(card => {
    card.addEventListener('click', () => {
      const subject = card.dataset.subject;
      selectSubject(subject);
      
      // Activate Chat Container layout
      heroSection.style.display = 'none';
      subjectGridContainer.style.display = 'none';
      chatContainer.style.display = 'flex';
      
      // Focus input
      chatInput.focus();
      showToast(`Switched study mode to ${SUBJECT_DETAILS[subject].name}`, 'info');
    });
  });

  // Hero CTA Start Button
  heroStartBtn.addEventListener('click', () => {
    heroSection.style.display = 'none';
    subjectGridContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    chatInput.focus();
  });

  // Textarea resizing & Input triggers
  chatInput.addEventListener('input', () => {
    // Auto resize height
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight - 12) + 'px';
    
    // Character counter
    const currentLength = chatInput.value.length;
    charCounter.textContent = `${currentLength}/2000`;
    
    // Toggle send button disabled
    sendMsgBtn.disabled = (currentLength === 0 || isLoading);
  });

  // Input Keyboard bindings (Enter to send, Shift+Enter for newline)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent standard line break
      if (!sendMsgBtn.disabled) {
        sendMessage();
      }
    }
  });

  // Send Message Button Trigger
  sendMsgBtn.addEventListener('click', sendMessage);

  // Clear Session Dialog triggers
  const triggerClearSession = () => {
    if (chatHistory.length === 0) return;
    openConfirmModal();
  };
  clearChatBtn.addEventListener('click', triggerClearSession);
  clearChatBtnTop.addEventListener('click', triggerClearSession);

  // Modal Cancel triggers
  confirmCancelBtn.addEventListener('click', closeConfirmModal);
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeConfirmModal();
  });

  // Modal Confirm trigger
  confirmOkBtn.addEventListener('click', () => {
    clearAllHistory();
    closeConfirmModal();
    showToast('Conversation history deleted.', 'success');
  });

  // Stats Database Wipe Button
  if (historyResetBtn) {
    historyResetBtn.addEventListener('click', () => {
      openConfirmModal();
    });
  }
}

// ----------------------------------------------------
// 6. Navigation / Subject Filter Logic
// ----------------------------------------------------
function selectSubject(subjectKey) {
  // Clear previous selected shortcut highlights
  subjectShortcuts.forEach(btn => {
    btn.classList.remove('active-shortcut');
    if (btn.dataset.subject === subjectKey) {
      btn.classList.add('active-shortcut');
    }
  });

  activeSubject = subjectKey;
  
  if (subjectKey) {
    const details = SUBJECT_DETAILS[subjectKey];
    currentAssistantName.textContent = details.assistant;
    currentSubjectLabel.textContent = details.name;
    
    // Change active pulse classes or style colors depending on subject
    const indicator = document.querySelector('.buddy-status .status-indicator');
    indicator.style.backgroundColor = `var(--color-${subjectKey})`;
    indicator.style.boxShadow = `0 0 10px var(--color-${subjectKey})`;
  } else {
    currentAssistantName.textContent = 'Nexora AI';
    currentSubjectLabel.textContent = 'General Engineering Mode';
    
    const indicator = document.querySelector('.buddy-status .status-indicator');
    indicator.style.backgroundColor = 'var(--accent-blue)';
    indicator.style.boxShadow = '0 0 10px var(--accent-blue)';
  }

  renderSuggestions();
}

function renderSuggestions() {
  suggestionsGrid.innerHTML = '';
  const prompts = activeSubject ? SUBJECT_DETAILS[activeSubject].suggestions : GENERAL_SUGGESTIONS;

  prompts.forEach(prompt => {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip';
    chip.textContent = prompt;
    chip.addEventListener('click', () => {
      chatInput.value = prompt;
      // Trigger resizing manually
      chatInput.dispatchEvent(new Event('input'));
      // Automatically send
      sendMessage();
    });
    suggestionsGrid.appendChild(chip);
  });
}

// ----------------------------------------------------
// 7. Message Rendering & Chat Flow Logic
// ----------------------------------------------------
function renderAllMessages() {
  messagesList.innerHTML = '';
  chatHistory.forEach(msg => {
    appendMessageToUI(msg.role, msg.content, msg.timestamp, msg.subject);
  });
}

function appendMessageToUI(role, content, timestamp, subject) {
  const isUser = (role === 'user');
  
  // Format visual meta values
  const dateObj = new Date(timestamp);
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const avatarText = isUser ? 'ME' : 'AI';
  
  // Construct message bubble container
  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${isUser ? 'user' : 'assistant'}`;
  
  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'bubble-avatar';
  avatar.textContent = avatarText;
  
  // Body container
  const body = document.createElement('div');
  body.className = 'bubble-body';
  
  // Bubble Content (Parse markdown for Assistant)
  const contentEl = document.createElement('div');
  contentEl.className = 'bubble-content';
  
  if (isUser) {
    contentEl.textContent = content;
  } else {
    contentEl.innerHTML = parseMarkdownToHTML(content);
  }
  
  // Meta block
  const meta = document.createElement('div');
  meta.className = 'bubble-meta';
  
  const timeLabel = document.createElement('span');
  timeLabel.textContent = timeStr;
  meta.appendChild(timeLabel);
  
  // Add Subject indicator label for assistant message
  if (!isUser && subject) {
    const subjectLabel = document.createElement('span');
    subjectLabel.className = `badge badge-${subject}`;
    subjectLabel.style.padding = '2px 8px';
    subjectLabel.style.fontSize = '0.65rem';
    subjectLabel.textContent = subject.toUpperCase();
    meta.appendChild(subjectLabel);
  }

  // Copy button (Only for AI responses)
  if (!isUser) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-msg-btn';
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <span>Copy</span>
    `;
    copyBtn.addEventListener('click', () => {
      copyTextToClipboard(content, copyBtn);
    });
    meta.appendChild(copyBtn);
  }
  
  // Connect and append everything
  body.appendChild(contentEl);
  body.appendChild(meta);
  bubble.appendChild(avatar);
  bubble.appendChild(body);
  
  messagesList.appendChild(bubble);
}

// Send user message to Express API
async function sendMessage() {
  const text = chatInput.value.trim();
  if (text === '' || isLoading) return;

  // 1. Update states
  isLoading = true;
  chatInput.value = '';
  chatInput.style.height = 'auto'; // Reset text box size
  charCounter.textContent = '0/2000';
  sendMsgBtn.disabled = true;
  chatInput.disabled = true;

  // 2. Add message to local log state
  const timestamp = new Date().toISOString();
  const userMessage = {
    role: 'user',
    content: text,
    timestamp,
    subject: activeSubject
  };
  
  chatHistory.push(userMessage);
  saveChatHistoryToStorage();

  // 3. Clean layout views
  chatEmptyState.style.display = 'none';
  appendMessageToUI(userMessage.role, userMessage.content, userMessage.timestamp, userMessage.subject);
  scrollToLatestMessage();

  // 4. Show typing animation
  typingIndicator.style.display = 'flex';
  scrollToLatestMessage();

  try {
    // 5. Build clean history parameter (Gemini only needs role & content, without metadata)
    const historyPayload = chatHistory.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 6. Fetch call to server API
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        history: historyPayload
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server responded with status ${response.status}`);
    }

    // 7. Success logic
    const aiReply = data.reply;
    const aiMessage = {
      role: 'assistant',
      content: aiReply,
      timestamp: new Date().toISOString(),
      subject: activeSubject
    };

    chatHistory.push(aiMessage);
    saveChatHistoryToStorage();
    
    // Hide typing, append bubble
    typingIndicator.style.display = 'none';
    appendMessageToUI(aiMessage.role, aiMessage.content, aiMessage.timestamp, aiMessage.subject);
    scrollToLatestMessage();

  } catch (error) {
    console.error('Error fetching chat response:', error);
    
    // Hide typing indicator
    typingIndicator.style.display = 'none';
    
    // Show user error message bubble
    const errorMsg = `I encountered an issue processing your request: "${error.message}". Please verify your Gemini API key is configured correctly in your backend .env file and try again.`;
    const errMessageObj = {
      role: 'assistant',
      content: errorMsg,
      timestamp: new Date().toISOString(),
      subject: activeSubject
    };
    
    appendMessageToUI(errMessageObj.role, errMessageObj.content, errMessageObj.timestamp, errMessageObj.subject);
    scrollToLatestMessage();
    showToast(error.message || 'Failed to reach AI service.', 'error');
  } finally {
    isLoading = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
}

function scrollToLatestMessage() {
  messagesWindow.scrollTop = messagesWindow.scrollHeight;
}

function clearAllHistory() {
  chatHistory = [];
  saveChatHistoryToStorage();
  
  messagesList.innerHTML = '';
  chatEmptyState.style.display = 'flex';
  
  // Reset back to initial general mode
  selectSubject(null);
  
  // Hide chat container, show hero page again
  chatContainer.style.display = 'none';
  heroSection.style.display = 'block';
  subjectGridContainer.style.display = 'block';
}

// ----------------------------------------------------
// 8. Clipboard Integration Helpers
// ----------------------------------------------------
function copyTextToClipboard(text, btnElement) {
  if (!navigator.clipboard) {
    // Fallback if Clipboard API is blocked or unsupported
    fallbackCopyText(text, btnElement);
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    updateCopyBtnUI(btnElement);
  }, (err) => {
    console.error('Could not copy text: ', err);
    showToast('Failed to copy text to clipboard.', 'error');
  });
}

function fallbackCopyText(text, btnElement) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  // Make it out of view
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      updateCopyBtnUI(btnElement);
    } else {
      showToast('Failed to copy text.', 'error');
    }
  } catch (err) {
    showToast('Failed to copy text.', 'error');
  }
  document.body.removeChild(textArea);
}

function updateCopyBtnUI(btnElement) {
  const originalHTML = btnElement.innerHTML;
  btnElement.classList.add('copied');
  btnElement.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>Copied!</span>
  `;
  showToast('Copied content to clipboard.', 'success');
  
  setTimeout(() => {
    btnElement.classList.remove('copied');
    btnElement.innerHTML = originalHTML;
  }, 2000);
}

// Globally exposes copy feature for code snippet components
window.copyCodeSnippet = function(btn) {
  const pre = btn.parentElement.nextElementSibling;
  const code = pre.querySelector('code');
  copyTextToClipboard(code.innerText, btn);
};

// ----------------------------------------------------
// 9. Custom Regex Markdown Parser
// ----------------------------------------------------
function parseMarkdownToHTML(markdown) {
  if (!markdown) return '';
  
  let html = markdown;

  // Escaping raw HTML tags to prevent cross-site scripting (XSS)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Triple-backtick Code Blocks with Language Highlights
  // Format: ```javascript ... ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  html = html.replace(codeBlockRegex, (match, lang, code) => {
    const cleanLang = lang || 'code';
    // Trim extra spaces
    const cleanCode = code.trim();
    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span>${cleanLang}</span>
          <button class="copy-code-btn" onclick="window.copyCodeSnippet(this)">Copy</button>
        </div>
        <pre><code class="language-${cleanLang}">${cleanCode}</code></pre>
      </div>
    `;
  });

  // 2. Inline Code Blocks: `code`
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 3. Headings: #, ##, ###, etc.
  html = html.replace(/^\s*###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^\s*##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^\s*#\s+(.+)$/gm, '<h1>$1</h1>');

  // 4. Strong / Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. Italics: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 6. Blockquotes: > text
  html = html.replace(/^\s*&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // 7. Bullet Lists: - item or * item
  // Capture lines starting with - or * and format as list items
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  // Wrap sequential <li> tags in <ul>
  // This looks for <li> blocks and wraps them
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // 8. Numbered Lists: 1. item
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  // Wrap lists in <ol> if it is sequential and has numbers, though a simple ul wrapper is basic.
  // We handle it simply by wrapping <li> groups or letting standard browser flow handle lists.
  // To avoid breaking layout, we wrap lists cleanly:
  html = html.replace(/(<li>[^<]+<\/li>)/g, '$1');

  // 9. Paragraph Decompositions:
  // Split content by double lines and wrap sections in <p> unless they are already headers, blocks, lists.
  const lines = html.split(/\n{2,}/);
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    // If line already contains block structural elements, don't wrap in <p>
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<div') || 
      trimmed.startsWith('<pre') || 
      trimmed.startsWith('<ul') || 
      trimmed.startsWith('<ol') || 
      trimmed.startsWith('<li') || 
      trimmed.startsWith('<blockquote')
    ) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  });

  return formattedLines.join('');
}

// ----------------------------------------------------
// 10. Modals, Confirmations, and Toasts UI Helpers
// ----------------------------------------------------
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon configuration depending on status type
  let iconSVG = '';
  if (type === 'success') {
    iconSVG = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else if (type === 'error') {
    iconSVG = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  } else {
    iconSVG = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    ${iconSVG}
    <div class="toast-message">${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Fade out toast after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// CSS Toast Exit animation configuration
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(50px); }
  }
`, styleSheet.cssRules.length);

function openConfirmModal() {
  confirmModal.classList.add('active');
}

function closeConfirmModal() {
  confirmModal.classList.remove('active');
}
