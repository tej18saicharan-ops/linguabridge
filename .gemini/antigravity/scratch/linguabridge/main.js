document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // DOM Elements
  const apiStatusBadge = document.getElementById('api-status');
  const sourceLangSelect = document.getElementById('source-lang-select');
  const targetLangSelect = document.getElementById('target-lang-select');
  const sourceText = document.getElementById('source-text');
  const outputPlaceholder = document.getElementById('output-placeholder');
  const outputText = document.getElementById('output-text');
  const charCount = document.getElementById('char-count');
  const clearBtn = document.getElementById('clear-btn');
  const swapLangsBtn = document.getElementById('swap-langs-btn');
  const copyBtn = document.getElementById('copy-btn');
  const speakBtn = document.getElementById('speak-btn');
  const translateBtn = document.getElementById('translate-btn');
  const translationLoader = document.getElementById('translation-loader');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  // State Variables
  let isTranslating = false;
  let localHistory = JSON.parse(localStorage.getItem('linguabridge_history') || '[]');

  // 1. System Health Check
  async function checkSystemHealth() {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setSystemStatus('online', 'API Service Connected');
      } else {
        setSystemStatus('offline', 'System Error');
      }
    } catch (error) {
      console.warn('System health check failed. Using offline mode indicator.', error);
      // Since it's local development, if Vercel CLI is not running yet, show local mode
      setSystemStatus('online', 'Offline Mode (Mock Ready)');
    }
  }

  function setSystemStatus(status, message) {
    apiStatusBadge.className = `api-status-badge ${status}`;
    const statusText = apiStatusBadge.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // 2. Character Counter & Clear Button
  sourceText.addEventListener('input', () => {
    const text = sourceText.value;
    charCount.textContent = text.length;

    if (text.length > 0) {
      clearBtn.classList.add('visible');
    } else {
      clearBtn.classList.remove('visible');
      resetOutput();
    }
  });

  clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    charCount.textContent = '0';
    clearBtn.classList.remove('visible');
    resetOutput();
    sourceText.focus();
  });

  function resetOutput() {
    outputText.textContent = '';
    outputText.classList.add('hidden');
    outputPlaceholder.classList.remove('hidden');
    translationLoader.classList.add('hidden');
  }

  // Keyboard shortcut (Ctrl + Enter to translate)
  sourceText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      triggerTranslation();
    }
  });

  // 3. Swap Languages
  swapLangsBtn.addEventListener('click', () => {
    const sourceVal = sourceLangSelect.value;
    const targetVal = targetLangSelect.value;

    // We can't swap "Auto-Detect" to target, so default to English if source is Auto
    if (sourceVal === 'auto') {
      sourceLangSelect.value = targetVal;
      targetLangSelect.value = 'English';
    } else {
      sourceLangSelect.value = targetVal;
      targetLangSelect.value = sourceVal;
    }

    // Swap text contents if output exists
    const sourceTextVal = sourceText.value;
    const outputTextVal = outputText.textContent;

    if (outputTextVal && !outputText.classList.contains('hidden')) {
      sourceText.value = outputTextVal;
      outputText.textContent = sourceTextVal;
      charCount.textContent = outputTextVal.length;
    }
  });

  // 4. Translate Trigger
  translateBtn.addEventListener('click', triggerTranslation);

  async function triggerTranslation() {
    const text = sourceText.value.trim();
    const sourceLang = sourceLangSelect.value === 'auto' ? '' : sourceLangSelect.value;
    const targetLang = targetLangSelect.value;

    if (!text) return;
    if (isTranslating) return;

    // Update UI state to loading
    isTranslating = true;
    translateBtn.disabled = true;
    outputPlaceholder.classList.add('hidden');
    outputText.classList.add('hidden');
    translationLoader.classList.remove('hidden');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred during translation.');
      }

      // Display output
      outputText.textContent = data.translatedText;
      translationLoader.classList.add('hidden');
      outputText.classList.remove('hidden');

      // Add to history
      saveToHistory({
        original: text,
        translated: data.translatedText,
        source: sourceLangSelect.value === 'auto' ? (data.sourceLang || 'Auto') : sourceLangSelect.value,
        target: targetLang,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(error);
      outputText.innerHTML = `<span style="color: var(--status-offline); font-weight: 500;">Error: ${error.message}</span>`;
      translationLoader.classList.add('hidden');
      outputText.classList.remove('hidden');
    } finally {
      isTranslating = false;
      translateBtn.disabled = false;
    }
  }

  // 5. Copy & Speak Features
  copyBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (!text || outputText.classList.contains('hidden')) return;

    navigator.clipboard.writeText(text).then(() => {
      // Toggle button icon as visual feedback
      const icon = copyBtn.querySelector('i');
      icon.setAttribute('data-lucide', 'check');
      copyBtn.setAttribute('data-tooltip', 'Copied!');
      lucide.createIcons();

      setTimeout(() => {
        icon.setAttribute('data-lucide', 'copy');
        copyBtn.setAttribute('data-tooltip', 'Copy translation');
        lucide.createIcons();
      }, 2000);
    });
  });

  speakBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (!text || outputText.classList.contains('hidden')) return;

    // Stop currently speaking voices
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Simple language code matching
    const langCodes = {
      'English': 'en-US',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-PT',
      'Japanese': 'ja-JP',
      'Chinese': 'zh-CN',
      'Hindi': 'hi-IN',
      'Arabic': 'ar-SA'
    };
    
    const targetLang = targetLangSelect.value;
    if (langCodes[targetLang]) {
      utterance.lang = langCodes[targetLang];
    }
    
    window.speechSynthesis.speak(utterance);
  });

  // 6. History Management
  function saveToHistory(item) {
    // Generate simple ID
    item.id = Date.now().toString();
    
    // Add to top of stack
    localHistory.unshift(item);
    
    // Keep max 20 items
    if (localHistory.length > 20) {
      localHistory.pop();
    }
    
    localStorage.setItem('linguabridge_history', JSON.stringify(localHistory));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    
    if (localHistory.length === 0) {
      historyList.innerHTML = `
        <div style="text-align: center; color: var(--text-dark); padding: 2rem 0; font-size: 0.95rem; font-style: italic;">
          No recent translations. Try translating something above!
        </div>
      `;
      return;
    }

    localHistory.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const timeFormatted = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      historyItem.innerHTML = `
        <div class="history-meta">
          <div class="history-languages">
            <span>${item.source}</span>
            <span class="arrow-icon"><i data-lucide="arrow-right" style="width: 12px; height: 12px;"></i></span>
            <span>${item.target}</span>
          </div>
          <span class="history-time">${timeFormatted}</span>
        </div>
        <div class="history-content">
          <div class="history-orig">${escapeHTML(item.original)}</div>
          <div class="history-trans">${escapeHTML(item.translated)}</div>
        </div>
      `;
      
      // Allow clicking history item to restore it to the input field
      historyItem.addEventListener('click', () => {
        sourceText.value = item.original;
        sourceLangSelect.value = item.source === 'Auto' ? 'auto' : (sourceLangSelect.querySelector(`option[value="${item.source}"]`) ? item.source : 'auto');
        targetLangSelect.value = item.target;
        charCount.textContent = item.original.length;
        clearBtn.classList.add('visible');
        
        outputText.textContent = item.translated;
        outputPlaceholder.classList.add('hidden');
        outputText.classList.remove('hidden');
        
        sourceText.scrollIntoView({ behavior: 'smooth' });
      });

      historyList.appendChild(historyItem);
    });
    
    lucide.createIcons();
  }

  clearHistoryBtn.addEventListener('click', () => {
    localHistory = [];
    localStorage.removeItem('linguabridge_history');
    renderHistory();
  });

  // Helper to escape HTML and prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // 7. Initialize
  checkSystemHealth();
  
  // If there's no local history, fetch mock messages from the serverless API to populate history
  if (localHistory.length === 0) {
    fetch('/api/messages')
      .then(res => res.json())
      .then(mockData => {
        if (Array.isArray(mockData) && localHistory.length === 0) {
          localHistory = mockData;
          localStorage.setItem('linguabridge_history', JSON.stringify(localHistory));
          renderHistory();
        }
      })
      .catch(err => {
        console.warn('Could not load mock history messages on load', err);
        renderHistory();
      });
  } else {
    renderHistory();
  }
});
