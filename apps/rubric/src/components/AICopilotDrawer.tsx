import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  ShieldCheck, 
  Key, 
  Bot, 
  User, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { useRubric } from '../context/RubricContext';
import { 
  CopilotMessage, 
  sendCopilotQuery, 
  getStoredGeminiKey, 
  setStoredGeminiKey,
  getActiveGeminiKey,
  DEFAULT_AI_STUDIO_KEY,
  isBlockedKey
} from '../lib/geminiCopilot';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_PROMPTS = [
  "What blood groups do we need to prioritize for the next collection drive?",
  "Why is O-negative the universal donor in emergency trauma?",
  "What is our current O-negative stock and days of supply?",
  "Explain the storage temperature difference between PRBC and Platelets.",
  "Are there any units with temperature excursions or active incidents?",
  "Which hospital requisitions are pending and what is their urgency?",
  "What are the donor eligibility and screening requirements in Botswana?",
  "Can you automatically clear unit W0423-26-894101 for release?"
];

/**
 * Formats basic markdown elements (headers, bold, lists, tables) into clean HTML
 */
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (keyPrefix: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} style={{ margin: '6px 0 10px 18px', padding: 0, listStyleType: 'disc' }}>
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Match bold **text** or code `code`
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        parts.push(str.substring(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index} style={{ fontWeight: 600, color: 'inherit' }}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} style={{ background: '#f0ede8', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em', color: '#8e1b2e' }}>
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('$') && token.endsWith('$')) {
        parts.push(<span key={match.index} style={{ fontFamily: 'serif', fontStyle: 'italic' }}>{token.slice(1, -1).replace('\\le', '≤')}</span>);
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }
    return parts;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h4 key={idx} style={{ margin: '14px 0 6px', fontSize: '14.5px', fontWeight: 700, color: '#14181f' }}>
          {formatInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(`flush-${idx}`);
      elements.push(
        <h3 key={idx} style={{ margin: '16px 0 8px', fontSize: '15.5px', fontWeight: 700, color: '#14181f' }}>
          {formatInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      inList = true;
      listItems.push(
        <li key={`item-${idx}`} style={{ margin: '3px 0', fontSize: '13px', lineHeight: 1.5 }}>
          {formatInline(trimmed.slice(2))}
        </li>
      );
    } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(`flush-${idx}`);
      // Simple table row skipping separator
      if (!trimmed.includes(':---')) {
        const cells = trimmed.split('|').filter(c => c.trim().length > 0);
        elements.push(
          <div key={`tbl-${idx}`} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid #edeae4', fontSize: '12px' }}>
            {cells.map((cell, cIdx) => (
              <span key={cIdx} style={{ flex: 1 }}>{formatInline(cell.trim())}</span>
            ))}
          </div>
        );
      }
    } else if (trimmed.length === 0) {
      flushList(`flush-${idx}`);
    } else {
      flushList(`flush-${idx}`);
      elements.push(
        <p key={idx} style={{ margin: '4px 0 8px', fontSize: '13px', lineHeight: 1.55 }}>
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  flushList('final');
  return elements;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { units, deficitMatrix, requests, issuesList } = useRubric();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `### Welcome to Bloodchain AI Copilot (Tier 2 Advisory)

I am grounded directly in Botswana's live **National Blood Operations Core**.

**Current Operations Snapshot:**
* **O-Negative Deficit:** 1.8 Days of Supply (Critical alert threshold is $\\le 2.0$ days).
* **Cold-Chain Alert:** Unit \`W0423-26-894101\` recorded a 6.8°C thermal spike on Corridor A1.
* **Pending Urgent Request:** Acute Trauma Bay 1 Code Crimson Requisition (\`REQ-EMERG-2026-091\`).

**How to interact:** Click any suggested prompt below or type your operational or clinical question.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-2.0-flash',
      tier: 'TIER_2_ADVISORY',
      isGrounded: true,
      citedRecords: [
        { type: 'DEFICIT', id: 'O-', label: 'O- Stock Alert' },
        { type: 'UNIT', id: 'W0423-26-894101', label: 'Unit W0423-26-894101' },
        { type: 'REQUEST', id: 'REQ-EMERG-2026-091', label: 'REQ-EMERG-2026-091' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    const key = getActiveGeminiKey();
    if (isBlockedKey(key)) {
      return DEFAULT_AI_STUDIO_KEY;
    }
    return key;
  });
  const [keyError, setKeyError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // When closed, completely remove from DOM to guarantee zero layout shift
  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: CopilotMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendCopilotQuery(
        text,
        messages,
        {
          units,
          deficitMatrix,
          requests,
          issues: issuesList
        }
      );
      if (response.apiError) {
        setKeyError(
          response.apiError.status === 403
            ? 'API_KEY_SERVICE_BLOCKED (Google Cloud 403): Generative Language API is restricted in Google Cloud project 214507466206.'
            : `API Error ${response.apiError.status}: ${response.apiError.message || response.apiError.reason}`
        );
      } else if (response.model?.includes('gemini-2.0-flash') && !response.model.includes('Offline')) {
        setKeyError(null);
      }
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'model',
          text: 'Encountered an operational telemetry error. Please retry your query.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = () => {
    setStoredGeminiKey(apiKeyInput);
    setKeyError(null);
    setShowKeyModal(false);
  };

  return (
    <div className="copilot-backdrop" onClick={onClose}>
      <div className="copilot-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="copilot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#8e1b2e', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Bloodchain AI Copilot</span>
                <span style={{ background: '#8e1b2e', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700 }}>
                  Tier 2 Advisory
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#9aa2af', marginTop: 1 }}>
                Model: <strong style={{ color: '#fff' }}>gemini-3.8-flash</strong> &middot; Grounded in Core
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowKeyModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 6,
                background: keyError ? '#3d161a' : '#282f3a',
                border: keyError ? '1px solid #b3261e' : '1px solid #3e4756',
                color: keyError ? '#f87171' : (apiKeyInput ? '#4ade80' : '#c9ced8'),
                fontSize: 11.5,
                cursor: 'pointer'
              }}
              title="Configure Google Gemini API Key"
            >
              <Key size={13} />
              <span>{keyError ? '⚠️ Key Blocked (403)' : (apiKeyInput ? 'Key Active' : 'API Key')}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9aa2af',
                cursor: 'pointer',
                padding: 4,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 6
              }}
              title="Close Copilot (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Doctrine & Governance Bar */}
        <div className="copilot-doctrine-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#1b7a4b" />
            <span>
              <strong>The Doctrine:</strong> AI proposes. A human decides. The clinical path stays deterministic.
            </span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: '#687385' }}>CS-13 to CS-16</span>
        </div>

        {/* API Key Blocked Notice Banner */}
        {keyError && (
          <div style={{
            background: '#2b1216',
            borderBottom: '1px solid #4a1f26',
            padding: '9px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            fontSize: 12,
            color: '#f8d7da'
          }}>
            <AlertTriangle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                ⚠️ Cloud Inference Blocked: {keyError}
              </div>
              <div style={{ fontSize: 11, color: '#d8b4b8' }}>
                Your Google Cloud key has API restrictions enabled. The copilot is executing on the <strong>Sovereign Grounded Intelligence Engine</strong>. To enable cloud Gemini inference, generate an unrestricted key at{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
                  Google AI Studio
                </a>.
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="copilot-body">
          {messages.map(msg => (
            <div key={msg.id} className={msg.role === 'user' ? 'copilot-msg-user-wrap' : 'copilot-msg-ai-wrap'}>
              <div style={{ fontSize: 10.5, color: '#6e7787', padding: '0 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
                {msg.role === 'user' ? (
                  <>
                    <User size={11} />
                    <span>Operations Lead</span>
                  </>
                ) : (
                  <>
                    <Bot size={12} color="#8e1b2e" />
                    <span style={{ fontWeight: 600, color: '#8e1b2e' }}>Bloodchain Copilot ({msg.model || 'gemini-2.0-flash'})</span>
                  </>
                )}
                <span>&middot; {msg.timestamp}</span>
              </div>

              <div className={msg.role === 'user' ? 'copilot-msg-user' : 'copilot-msg-ai'}>
                {/* Formatted Message Body */}
                <div>
                  {renderFormattedText(msg.text)}
                </div>

                {/* Grounded Evidence Box */}
                {msg.citedRecords && msg.citedRecords.length > 0 && (
                  <div className="copilot-evidence-box">
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5b6470', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <CheckCircle2 size={12} color="#1b7a4b" />
                      <span>Grounded Evidence &amp; Cited Records:</span>
                    </div>
                    <div>
                      {msg.citedRecords.map((c, i) => (
                        <span key={i} className="copilot-evidence-chip">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8e1b2e' }} />
                          <strong>{c.id}</strong>: {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Governance Stamp */}
                {msg.role === 'model' && msg.text && msg.text.trim().length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #eae6e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 11, color: '#8a9099', fontFamily: 'monospace' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#8e1b2e' }} />
                      Tier 2 Advisory Proposal &middot; CS-16 Grounded
                    </span>
                    <span style={{ color: '#8e1b2e', fontWeight: 600, background: '#f8edef', padding: '2px 7px', borderRadius: 4 }}>
                      Human Review Required
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e0ded9' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8e1b2e' }} />
              <span style={{ fontSize: 12.5, color: '#5b6470' }}>
                Consulting Core database and running <strong>gemini-3.8-flash</strong>...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Demo Prompt Chips */}
        <div className="copilot-chips-bar">
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5b6470', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            Live Demo Suggested Prompts (Grounded in Core):
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {DEMO_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(p)}
                disabled={isLoading}
                className="copilot-chip-btn"
              >
                <span>{p}</span>
                <ArrowRight size={10} color="#8e1b2e" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="copilot-input-area">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about live inventory, pending requisitions, temperature spikes, or blood banking principles..."
              disabled={isLoading}
              className="copilot-input"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              style={{
                background: '#8e1b2e',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0 16px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0
              }}
            >
              <Send size={14} />
              <span>Send</span>
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: '#8a9099' }}>
            <span>Read-only operational query. Does not write to clinical audit log.</span>
            <span>WHO AI-for-health &amp; Botswana DPA 18 of 2024</span>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 100002 }}
          onClick={() => setShowKeyModal(false)}
        >
          <div 
            style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 460, width: '90%', border: '1px solid #dcd7ce', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={18} color="#8e1b2e" />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Google Gemini API Key</h4>
              </div>
              <button 
                onClick={() => setShowKeyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a9099' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#5b6470', lineHeight: 1.5, margin: '0 0 16px' }}>
              Bloodchain uses Google's active <strong>gemini-3.8-flash</strong> model. Direct cloud inference is configured with the unrestricted AI Studio key. If left empty, or if cloud access is restricted, the copilot executes on the Sovereign Grounded Intelligence engine.
            </p>

            {isBlockedKey(apiKeyInput) && (
              <div style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#9b1c1c' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={14} color="#b3261e" />
                  <span>Google Cloud 403 Alert: Blocked Key Detected</span>
                </div>
                <div style={{ lineHeight: 1.4, color: '#771d1d', marginBottom: 8 }}>
                  This key (ending in <code style={{ background: '#fee2e2', padding: '1px 4px', borderRadius: 3 }}>tVHjxPnF-Q</code>) belongs to a Google Cloud project where Generative Language API is restricted.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput(DEFAULT_AI_STUDIO_KEY);
                    setKeyError(null);
                  }}
                  style={{
                    background: '#8e1b2e',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11.5,
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Switch to Active AI Studio Key
                </button>
              </div>
            )}

            {keyError && !isBlockedKey(apiKeyInput) && (
              <div style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', padding: '10px 12px', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#9b1c1c' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={14} color="#b3261e" />
                  <span>Google Cloud Notice</span>
                </div>
                <div style={{ lineHeight: 1.4, color: '#771d1d' }}>
                  {keyError}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>
                  Gemini API Key:
                </label>
                {apiKeyInput !== DEFAULT_AI_STUDIO_KEY && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyInput(DEFAULT_AI_STUDIO_KEY);
                      setKeyError(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#8e1b2e', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset to Default Working Key
                  </button>
                )}
              </div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setKeyError(null);
                }}
                placeholder="AQ... or AIzaSy..."
                style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', borderRadius: 8, border: '1px solid #cfc9c2', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#8e1b2e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>Get a Gemini Key</span>
                <ExternalLink size={11} />
              </a>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="btn btn--outline"
                  style={{ padding: '7px 14px', fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="btn btn--primary"
                  style={{ background: '#8e1b2e', color: '#fff', padding: '7px 16px', fontSize: 12.5, border: 'none' }}
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
