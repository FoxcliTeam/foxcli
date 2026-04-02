import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { memo, type ReactNode } from 'react';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { stringWidth } from '../../ink/stringWidth.js';
import { Box, Text } from '../../ink.js';
import { truncatePathMiddle, truncateToWidth } from '../../utils/format.js';
import type { Theme } from '../../utils/theme.js';
export type SuggestionItem = {
  id: string;
  displayText: string;
  tag?: string;
  description?: string;
  metadata?: unknown;
  color?: keyof Theme;
};
export type SuggestionType = 'command' | 'file' | 'directory' | 'agent' | 'shell' | 'custom-title' | 'slack-channel' | 'none';
export const OVERLAY_MAX_ITEMS = 5;

/**
 * Get the icon for a suggestion based on its type
 * Icons: + for files, ◇ for MCP resources, * for agents
 */
function getIcon(itemId: string): string {
  if (itemId.startsWith('file-')) return '+';
  if (itemId.startsWith('mcp-resource-')) return '◇';
  if (itemId.startsWith('agent-')) return '*';
  return '+';
}

/**
 * Check if an item is a unified suggestion type (file, mcp-resource, or agent)
 */
function isUnifiedSuggestion(itemId: string): boolean {
  return itemId.startsWith('file-') || itemId.startsWith('mcp-resource-') || itemId.startsWith('agent-');
}
const SuggestionItemRow = memo(function SuggestionItemRow(t0: { item: SuggestionItem; maxColumnWidth: number; isSelected: boolean }) {
  const $ = _c(36);
  const {
    item,
    maxColumnWidth,
    isSelected
  } = t0;
  const columns = useTerminalSize().columns;
  const isUnified = isUnifiedSuggestion(item.id);
  if (isUnified) {
    let t1;
    if ($[0] !== item.id) {
      t1 = getIcon(item.id);
      $[0] = item.id;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    const icon = t1;
    const textColor = isSelected ? "suggestion" : undefined;
    const dimColor = !isSelected;
    const isFile = item.id.startsWith("file-");
    const isMcpResource = item.id.startsWith("mcp-resource-");
    const separatorWidth = item.description ? 3 : 0;
    let displayText;
    if (isFile) {
      let t2;
      if ($[2] !== item.description) {
        t2 = item.description ? Math.min(20, stringWidth(item.description)) : 0;
        $[2] = item.description;
        $[3] = t2;
      } else {
        t2 = $[3];
      }
      const descReserve = t2;
      const maxPathLength = columns - 2 - 4 - separatorWidth - descReserve;
      let t3;
      if ($[4] !== item.displayText || $[5] !== maxPathLength) {
        t3 = truncatePathMiddle(item.displayText, maxPathLength);
        $[4] = item.displayText;
        $[5] = maxPathLength;
        $[6] = t3;
      } else {
        t3 = $[6];
      }
      displayText = t3;
    } else {
      if (isMcpResource) {
        let t2;
        if ($[7] !== item.displayText) {
          t2 = truncateToWidth(item.displayText, 30);
          $[7] = item.displayText;
          $[8] = t2;
        } else {
          t2 = $[8];
        }
        displayText = t2;
      } else {
        displayText = item.displayText;
      }
    }
    const availableWidth = columns - 2 - stringWidth(displayText) - separatorWidth - 4;
    let lineContent;
    if (item.description) {
      const maxDescLength = Math.max(0, availableWidth);
      let t2;
      if ($[9] !== item.description || $[10] !== maxDescLength) {
        t2 = truncateToWidth(item.description.replace(/\s+/g, " "), maxDescLength);
        $[9] = item.description;
        $[10] = maxDescLength;
        $[11] = t2;
      } else {
        t2 = $[11];
      }
      const truncatedDesc = t2;
      lineContent = `${icon} ${displayText} – ${truncatedDesc}`;
    } else {
      lineContent = `${icon} ${displayText}`;
    }
    let t2;
    if ($[12] !== dimColor || $[13] !== lineContent || $[14] !== textColor) {
      t2 = <Text color={textColor} dimColor={dimColor} wrap="truncate">{lineContent}</Text>;
      $[12] = dimColor;
      $[13] = lineContent;
      $[14] = textColor;
      $[15] = t2;
    } else {
      t2 = $[15];
    }
    return t2;
  }
  const maxNameWidth = Math.floor(columns * 0.4);
  const displayTextWidth = Math.min(maxColumnWidth ?? stringWidth(item.displayText) + 5, maxNameWidth);
  const textColor_0 = item.color || (isSelected ? "suggestion" : undefined);
  const shouldDim = !isSelected;
  let displayText_0 = item.displayText;
  if (stringWidth(displayText_0) > displayTextWidth - 2) {
    const t1 = displayTextWidth - 2;
    let t2;
    if ($[16] !== displayText_0 || $[17] !== t1) {
      t2 = truncateToWidth(displayText_0, t1);
      $[16] = displayText_0;
      $[17] = t1;
      $[18] = t2;
    } else {
      t2 = $[18];
    }
    displayText_0 = t2;
  }
  const paddedDisplayText = displayText_0 + " ".repeat(Math.max(0, displayTextWidth - stringWidth(displayText_0)));
  const tagText = item.tag ? `[${item.tag}] ` : "";
  const tagWidth = stringWidth(tagText);
  const descriptionWidth = Math.max(0, columns - displayTextWidth - tagWidth - 4);
  let t1;
  if ($[19] !== descriptionWidth || $[20] !== item.description) {
    t1 = item.description ? truncateToWidth(item.description.replace(/\s+/g, " "), descriptionWidth) : "";
    $[19] = descriptionWidth;
    $[20] = item.description;
    $[21] = t1;
  } else {
    t1 = $[21];
  }
  const truncatedDescription = t1;
  let t2;
  if ($[22] !== paddedDisplayText || $[23] !== shouldDim || $[24] !== textColor_0) {
    t2 = <Text color={textColor_0} dimColor={shouldDim}>{paddedDisplayText}</Text>;
    $[22] = paddedDisplayText;
    $[23] = shouldDim;
    $[24] = textColor_0;
    $[25] = t2;
  } else {
    t2 = $[25];
  }
  let t3;
  if ($[26] !== tagText) {
    t3 = tagText ? <Text dimColor={true}>{tagText}</Text> : null;
    $[26] = tagText;
    $[27] = t3;
  } else {
    t3 = $[27];
  }
  const t4 = isSelected ? "suggestion" : undefined;
  const t5 = !isSelected;
  let t6;
  if ($[28] !== t4 || $[29] !== t5 || $[30] !== truncatedDescription) {
    t6 = <Text color={t4} dimColor={t5}>{truncatedDescription}</Text>;
    $[28] = t4;
    $[29] = t5;
    $[30] = truncatedDescription;
    $[31] = t6;
  } else {
    t6 = $[31];
  }
  let t7;
  if ($[32] !== t2 || $[33] !== t3 || $[34] !== t6) {
    t7 = <Text wrap="truncate">{t2}{t3}{t6}</Text>;
    $[32] = t2;
    $[33] = t3;
    $[34] = t6;
    $[35] = t7;
  } else {
    t7 = $[35];
  }
  return t7;
});
type Props = {
  suggestions: SuggestionItem[];
  selectedSuggestion: number;
  maxColumnWidth?: number;
  /**
   * When true, the suggestions are rendered inside a position=absolute
   * overlay. We omit minHeight and flex-end so the y-clamp in the
   * renderer doesn't push fewer items down into the prompt area.
   */
  overlay?: boolean;
};
export function PromptInputFooterSuggestions(t0) {
  const $ = _c(22);
  const {
    suggestions,
    selectedSuggestion,
    maxColumnWidth: maxColumnWidthProp,
    overlay
  } = t0;
  const {
    rows
  } = useTerminalSize();
  const maxVisibleItems = overlay ? OVERLAY_MAX_ITEMS : Math.min(6, Math.max(1, rows - 3));
  if (suggestions.length === 0) {
    return null;
  }
  let t1;
  if ($[0] !== maxColumnWidthProp || $[1] !== suggestions) {
    t1 = maxColumnWidthProp ?? Math.max(...suggestions.map(_temp)) + 5;
    $[0] = maxColumnWidthProp;
    $[1] = suggestions;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const maxColumnWidth = t1;
  const startIndex = Math.max(0, Math.min(selectedSuggestion - Math.floor(maxVisibleItems / 2), suggestions.length - maxVisibleItems));
  const endIndex = Math.min(startIndex + maxVisibleItems, suggestions.length);
  let T0;
  let t2;
  let t3;
  let t4;
  if ($[3] !== endIndex || $[4] !== maxColumnWidth || $[5] !== overlay || $[6] !== selectedSuggestion || $[7] !== startIndex || $[8] !== suggestions) {
    const visibleItems = suggestions.slice(startIndex, endIndex);
    T0 = Box;
    t2 = "column";
    t3 = overlay ? undefined : "flex-end";
    let t5;
    if ($[13] !== maxColumnWidth || $[14] !== selectedSuggestion || $[15] !== suggestions) {
      t5 = item_0 => <SuggestionItemRow key={item_0.id} item={item_0} maxColumnWidth={maxColumnWidth} isSelected={item_0.id === suggestions[selectedSuggestion]?.id} />;
      $[13] = maxColumnWidth;
      $[14] = selectedSuggestion;
      $[15] = suggestions;
      $[16] = t5;
    } else {
      t5 = $[16];
    }
    t4 = visibleItems.map(t5);
    $[3] = endIndex;
    $[4] = maxColumnWidth;
    $[5] = overlay;
    $[6] = selectedSuggestion;
    $[7] = startIndex;
    $[8] = suggestions;
    $[9] = T0;
    $[10] = t2;
    $[11] = t3;
    $[12] = t4;
  } else {
    T0 = $[9];
    t2 = $[10];
    t3 = $[11];
    t4 = $[12];
  }
  let t5;
  if ($[17] !== T0 || $[18] !== t2 || $[19] !== t3 || $[20] !== t4) {
    t5 = <T0 flexDirection={t2} justifyContent={t3}>{t4}</T0>;
    $[17] = T0;
    $[18] = t2;
    $[19] = t3;
    $[20] = t4;
    $[21] = t5;
  } else {
    t5 = $[21];
  }
  return t5;
}
function _temp(item) {
  return stringWidth(item.displayText);
}
export default memo(PromptInputFooterSuggestions);
