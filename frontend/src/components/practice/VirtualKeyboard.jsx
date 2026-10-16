// src/components/practice/VirtualKeyboard.jsx
import { useMemo } from 'react';

/**
 * Standard QWERTY keyboard layout definition with keycodes, labels, widths, and finger assignments.
 * Finger mapping (0-9):
 * 0: Left Pinky
 * 1: Left Ring
 * 2: Left Middle
 * 3: Left Index
 * 4: Left Thumb
 * 5: Right Thumb
 * 6: Right Index
 * 7: Right Middle
 * 8: Right Ring
 * 9: Right Pinky
 */
const KEYBOARD_ROWS = [
  // Row 1
  [
    { code: 'Backquote', label: '`', shiftLabel: '~', finger: 0, width: 1 },
    { code: 'Digit1', label: '1', shiftLabel: '!', finger: 0, width: 1 },
    { code: 'Digit2', label: '2', shiftLabel: '@', finger: 1, width: 1 },
    { code: 'Digit3', label: '3', shiftLabel: '#', finger: 2, width: 1 },
    { code: 'Digit4', label: '4', shiftLabel: '$', finger: 3, width: 1 },
    { code: 'Digit5', label: '5', shiftLabel: '%', finger: 3, width: 1 },
    { code: 'Digit6', label: '6', shiftLabel: '^', finger: 6, width: 1 },
    { code: 'Digit7', label: '7', shiftLabel: '&', finger: 6, width: 1 },
    { code: 'Digit8', label: '8', shiftLabel: '*', finger: 7, width: 1 },
    { code: 'Digit9', label: '9', shiftLabel: '(', finger: 8, width: 1 },
    { code: 'Digit0', label: '0', shiftLabel: ')', finger: 9, width: 1 },
    { code: 'Minus', label: '-', shiftLabel: '_', finger: 9, width: 1 },
    { code: 'Equal', label: '=', shiftLabel: '+', finger: 9, width: 1 },
    { code: 'Backspace', label: 'Bksp', finger: 9, width: 1.6 },
  ],
  // Row 2
  [
    { code: 'Tab', label: 'Tab', finger: 0, width: 1.4 },
    { code: 'KeyQ', label: 'q', shiftLabel: 'Q', finger: 0, width: 1 },
    { code: 'KeyW', label: 'w', shiftLabel: 'W', finger: 1, width: 1 },
    { code: 'KeyE', label: 'e', shiftLabel: 'E', finger: 2, width: 1 },
    { code: 'KeyR', label: 'r', shiftLabel: 'R', finger: 3, width: 1 },
    { code: 'KeyT', label: 't', shiftLabel: 'T', finger: 3, width: 1 },
    { code: 'KeyY', label: 'y', shiftLabel: 'Y', finger: 6, width: 1 },
    { code: 'KeyU', label: 'u', shiftLabel: 'U', finger: 6, width: 1 },
    { code: 'KeyI', label: 'i', shiftLabel: 'I', finger: 7, width: 1 },
    { code: 'KeyO', label: 'o', shiftLabel: 'O', finger: 8, width: 1 },
    { code: 'KeyP', label: 'p', shiftLabel: 'P', finger: 9, width: 1 },
    { code: 'BracketLeft', label: '[', shiftLabel: '{', finger: 9, width: 1 },
    { code: 'BracketRight', label: ']', shiftLabel: '}', finger: 9, width: 1 },
    { code: 'Backslash', label: '\\', shiftLabel: '|', finger: 9, width: 1.2 },
  ],
  // Row 3
  [
    { code: 'CapsLock', label: 'Caps', finger: 0, width: 1.7 },
    { code: 'KeyA', label: 'a', shiftLabel: 'A', finger: 0, width: 1 },
    { code: 'KeyS', label: 's', shiftLabel: 'S', finger: 1, width: 1 },
    { code: 'KeyD', label: 'd', shiftLabel: 'D', finger: 2, width: 1 },
    { code: 'KeyF', label: 'f', shiftLabel: 'F', finger: 3, width: 1 },
    { code: 'KeyG', label: 'g', shiftLabel: 'G', finger: 3, width: 1 },
    { code: 'KeyH', label: 'h', shiftLabel: 'H', finger: 6, width: 1 },
    { code: 'KeyJ', label: 'j', shiftLabel: 'J', finger: 6, width: 1 },
    { code: 'KeyK', label: 'k', shiftLabel: 'K', finger: 7, width: 1 },
    { code: 'KeyL', label: 'l', shiftLabel: 'L', finger: 8, width: 1 },
    { code: 'Semicolon', label: ';', shiftLabel: ':', finger: 9, width: 1 },
    { code: 'Quote', label: "'", shiftLabel: '"', finger: 9, width: 1 },
    { code: 'Enter', label: 'Enter', finger: 9, width: 2.1 },
  ],
  // Row 4
  [
    { code: 'ShiftLeft', label: 'Shift', finger: 0, width: 2.2 },
    { code: 'KeyZ', label: 'z', shiftLabel: 'Z', finger: 0, width: 1 },
    { code: 'KeyX', label: 'x', shiftLabel: 'X', finger: 1, width: 1 },
    { code: 'KeyC', label: 'c', shiftLabel: 'C', finger: 2, width: 1 },
    { code: 'KeyV', label: 'v', shiftLabel: 'V', finger: 3, width: 1 },
    { code: 'KeyB', label: 'b', shiftLabel: 'B', finger: 3, width: 1 },
    { code: 'KeyN', label: 'n', shiftLabel: 'N', finger: 6, width: 1 },
    { code: 'KeyM', label: 'm', shiftLabel: 'M', finger: 6, width: 1 },
    { code: 'Comma', label: ',', shiftLabel: '<', finger: 7, width: 1 },
    { code: 'Period', label: '.', shiftLabel: '>', finger: 8, width: 1 },
    { code: 'Slash', label: '/', shiftLabel: '?', finger: 9, width: 1 },
    { code: 'ShiftRight', label: 'Shift', finger: 9, width: 2.4 },
  ],
  // Row 5
  [
    { code: 'ControlLeft', label: 'Ctrl', finger: 0, width: 1.25 },
    { code: 'MetaLeft', label: 'Cmd', finger: 0, width: 1.2 },
    { code: 'AltLeft', label: 'Alt', finger: 4, width: 1.2 },
    { code: 'Space', label: 'Space', finger: 4, width: 6.2 },
    { code: 'AltRight', label: 'Alt', finger: 5, width: 1.2 },
    { code: 'MetaRight', label: 'Cmd', finger: 9, width: 1.2 },
    { code: 'ControlRight', label: 'Ctrl', finger: 9, width: 1.25 },
  ],
];

const FINGER_NAMES = [
  'Left Pinky',
  'Left Ring',
  'Left Middle',
  'Left Index',
  'Left Thumb',
  'Right Thumb',
  'Right Index',
  'Right Middle',
  'Right Ring',
  'Right Pinky',
];

/**
 * Returns which key object and which finger corresponds to the target char.
 */
function getActiveKeyAndFinger(char) {
  if (!char) return { activeKeyCodes: [], activeFinger: -1 };

  if (char === '\n') {
    return { activeKeyCodes: ['Enter'], activeFinger: 9 };
  }
  if (char === ' ' || char === '\t') {
    return { activeKeyCodes: ['Space'], activeFinger: 4 };
  }

  const lower = char.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    for (const key of row) {
      if (
        key.label.toLowerCase() === lower ||
        key.shiftLabel === char ||
        key.label === char
      ) {
        const needsShift = key.shiftLabel === char || (char >= 'A' && char <= 'Z');
        const activeKeyCodes = [key.code];
        if (needsShift) {
          // If right hand key, use left shift; if left hand key, use right shift
          activeKeyCodes.push(key.finger >= 5 ? 'ShiftLeft' : 'ShiftRight');
        }
        return { activeKeyCodes, activeFinger: key.finger };
      }
    }
  }

  return { activeKeyCodes: [], activeFinger: -1 };
}

export default function VirtualKeyboard({ targetChar, lastPressedCode }) {
  const { activeKeyCodes, activeFinger } = useMemo(
    () => getActiveKeyAndFinger(targetChar),
    [targetChar]
  );

  return (
    <div className="virtual-keyboard-card">
      {/* ── Keycaps Grid ── */}
      <div className="vk-keys-container">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="vk-row">
            {row.map((key) => {
              const isActive = activeKeyCodes.includes(key.code);
              const isPressed = lastPressedCode === key.code;

              return (
                <div
                  key={key.code}
                  className={`vk-key ${isActive ? 'key-active' : ''} ${
                    isPressed ? 'key-pressed' : ''
                  }`}
                  style={{ flex: key.width }}
                  data-code={key.code}
                >
                  {key.shiftLabel && (
                    <span className="vk-shift-lbl">{key.shiftLabel}</span>
                  )}
                  <span className="vk-main-lbl">{key.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── 10 Finger Placement Silhouettes Guide ── */}
      <div className="vk-finger-guide" aria-label="Finger placement guide">
        <div className="vk-hand vk-hand-left">
          {[0, 1, 2, 3, 4].map((fIdx) => {
            const isTargetFinger = activeFinger === fIdx;
            return (
              <div
                key={fIdx}
                className={`vk-finger finger-${fIdx} ${
                  isTargetFinger ? 'finger-active' : ''
                }`}
                title={FINGER_NAMES[fIdx]}
              />
            );
          })}
        </div>

        <div className="vk-hand vk-hand-right">
          {[5, 6, 7, 8, 9].map((fIdx) => {
            const isTargetFinger = activeFinger === fIdx;
            return (
              <div
                key={fIdx}
                className={`vk-finger finger-${fIdx} ${
                  isTargetFinger ? 'finger-active' : ''
                }`}
                title={FINGER_NAMES[fIdx]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
