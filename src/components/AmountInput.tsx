import React, { useEffect, useRef, useState } from "react";
import {
  TextInput,
  type ReturnKeyTypeOptions,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { applyAmountEdit, formatAmountInput, isWholeCurrency } from "../data/mock";

type Props = {
  /** Clean number; NaN renders as empty. Parent never parses strings. */
  value: number;
  onChangeValue: (n: number) => void;
  currency: string;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
  placeholderTextColor?: string;
  accessibilityLabel?: string;
  autoFocus?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
};

/**
 * Amount field with live thousand separators (5.000.000 for IDR,
 * 5,000,000 otherwise) and a cursor that stays where it belongs:
 * at the end when typing at the end, otherwise after the same digit.
 * The position is applied through `selection` right after a change and
 * released on the next tick so taps still move the cursor freely.
 */
export function AmountInput({
  value,
  onChangeValue,
  currency,
  style,
  placeholder,
  placeholderTextColor,
  accessibilityLabel,
  autoFocus,
  returnKeyType,
}: Props) {
  const [text, setText] = useState(() => formatAmountInput(value, currency));
  const [sel, setSel] = useState<{ start: number; end: number } | undefined>(undefined);
  const lastValue = useRef(value);
  const lastCurrency = useRef(currency);

  // Parent-driven changes (quick chips, reset, currency switch): reformat.
  useEffect(() => {
    if (value !== lastValue.current || currency !== lastCurrency.current) {
      lastValue.current = value;
      lastCurrency.current = currency;
      const formatted = formatAmountInput(value, currency);
      setText(formatted);
      setSel({ start: formatted.length, end: formatted.length });
    }
  }, [value, currency]);

  // Release the programmatic selection on the next tick so the user can
  // tap and move the cursor freely afterwards.
  useEffect(() => {
    if (sel === undefined) return;
    const t = setTimeout(() => setSel(undefined), 0);
    return () => clearTimeout(t);
  }, [sel]);

  function handleChange(raw: string) {
    const r = applyAmountEdit(text, sel?.start ?? text.length, raw, currency);
    lastValue.current = r.value;
    onChangeValue(r.value);
    setText(r.text);
    setSel({ start: r.cursor, end: r.cursor });
  }

  return (
    <TextInput
      value={text}
      onChangeText={handleChange}
      onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
      selection={sel}
      keyboardType={isWholeCurrency(currency) ? "number-pad" : "decimal-pad"}
      style={style}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      accessibilityLabel={accessibilityLabel}
      autoFocus={autoFocus}
      returnKeyType={returnKeyType}
    />
  );
}
